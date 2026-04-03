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
import { ProjectTypeItem } from "@/types";

const COL = "projectTypes";

const DEFAULTS: Omit<ProjectTypeItem, "createdAt" | "updatedAt">[] = [
  { id: "pt-mimari",   name: "Mimari Proje",       order: 1 },
  { id: "pt-statik",   name: "Statik Proje",        order: 2 },
  { id: "pt-elektrik", name: "Elektrik Projesi",    order: 3 },
  { id: "pt-mekanik",  name: "Mekanik Proje",       order: 4 },
  { id: "pt-ruhsat",   name: "Ruhsat Başvurusu",    order: 5 },
  { id: "pt-santiye",  name: "Şantiye Denetimi",    order: 6 },
  { id: "pt-danisman", name: "Danışmanlık",         order: 7 },
  { id: "pt-diger",    name: "Diğer",               order: 8 },
];

export async function getProjectTypes(): Promise<ProjectTypeItem[]> {
  const q = query(collection(db, COL), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name as string,
      order: (data.order as number) || 0,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as ProjectTypeItem;
  });
}

/** Idempotent seed — uses fixed IDs, won't overwrite if already exists */
export async function seedDefaultProjectTypes(): Promise<void> {
  const batch = writeBatch(db);
  DEFAULTS.forEach((pt) => {
    const ref = doc(db, COL, pt.id);
    const { id, ...rest } = pt;
    void id;
    batch.set(ref, { ...rest, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
  });
  await batch.commit();
}

export async function addProjectType(
  data: Omit<ProjectTypeItem, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProjectType(
  id: string,
  data: Partial<Omit<ProjectTypeItem, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProjectType(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
