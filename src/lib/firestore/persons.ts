import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Person } from "@/types";

const COLLECTION = "persons";

/** undefined olan alanları Firestore'a göndermeden önce temizler */
function stripUndefined(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
}

function docToPersonData(data: Record<string, unknown>, id: string): Person {
  return {
    id,
    name: data.name as string,
    phone: data.phone as string,
    email: data.email as string | undefined,
    address: data.address as string | undefined,
    taxNumber: data.taxNumber as string | undefined,
    companyName: data.companyName as string | undefined,
    notes: data.notes as string | undefined,
    categoryIds: (data.categoryIds as string[]) || [],
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getPersons(): Promise<Person[]> {
  const q = query(collection(db, COLLECTION), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) =>
    docToPersonData(d.data() as Record<string, unknown>, d.id)
  );
}

export async function getPerson(id: string): Promise<Person | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return docToPersonData(snap.data() as Record<string, unknown>, snap.id);
}

export async function addPerson(
  data: Omit<Person, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...stripUndefined(data as unknown as Record<string, unknown>),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updatePerson(
  id: string,
  data: Partial<Omit<Person, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...stripUndefined(data as unknown as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePerson(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
