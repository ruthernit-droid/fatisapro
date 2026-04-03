import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ServiceCategory } from "@/types";

const COL = "serviceCategories";

const DEFAULTS: Omit<ServiceCategory, "createdAt" | "updatedAt">[] = [
  { id: "sc-mimari",   name: "Mimari",             subcategories: [],                                    order: 1 },
  { id: "sc-statik",   name: "Statik",              subcategories: ["Kalıp İskele", "Betonarme"],          order: 2 },
  { id: "sc-elektrik", name: "Elektrik Tesisat",    subcategories: [],                                    order: 3 },
  { id: "sc-mekanik",  name: "Mekanik Tesisat",     subcategories: [],                                    order: 4 },
  { id: "sc-ruhsat",   name: "Ruhsat",              subcategories: [],                                    order: 5 },
  { id: "sc-santiye",  name: "Şantiye Denetimi",    subcategories: [],                                    order: 6 },
];

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const q = query(collection(db, COL), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name as string,
      subcategories: (data.subcategories as string[]) || [],
      order: (data.order as number) || 0,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as ServiceCategory;
  });
}

/** İdempotent seed — koleksiyon boşsa varsayılanları yükler, dolu ise hiçbir şeye dokunmaz */
export async function seedDefaultServiceCategories(): Promise<void> {
  const existing = await getDocs(query(collection(db, COL)));
  if (existing.size > 0) return; // zaten verisi var, üzerine yazma
  const batch = writeBatch(db);
  DEFAULTS.forEach((cat) => {
    const ref = doc(db, COL, cat.id);
    const { id, ...rest } = cat;
    void id;
    batch.set(ref, { ...rest, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
  await batch.commit();
}

export async function addServiceCategory(
  data: Omit<ServiceCategory, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateServiceCategory(
  id: string,
  data: Partial<Omit<ServiceCategory, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteServiceCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
