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
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PersonCategory } from "@/types";

const COLLECTION = "personCategories";

// Sabit ID'ler ile seed → React Strict Mode'da çift render'da dahi duplikat oluşmaz
const DEFAULT_CATEGORIES: (Omit<PersonCategory, "createdAt" | "updatedAt"> )[] = [
  { id: "cat-isveren",   name: "İşveren",    color: "#6366f1", isDefault: true, order: 1 },
  { id: "cat-muellif",   name: "Müellif",    color: "#0ea5e9", isDefault: true, order: 2 },
  { id: "cat-musteri",   name: "Müşteri",    color: "#10b981", isDefault: true, order: 3 },
  { id: "cat-tedarikci", name: "Tedarikçi",  color: "#f59e0b", isDefault: true, order: 4 },
];

export async function getCategories(): Promise<PersonCategory[]> {
  const q = query(collection(db, COLLECTION), orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name as string,
      color: data.color as string,
      icon: data.icon as string | undefined,
      isDefault: data.isDefault as boolean,
      order: data.order as number,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as PersonCategory;
  });
}

export async function seedDefaultCategories(): Promise<void> {
  // setDoc ile merge=false → sabit ID'lere yazar, zaten varsa üzerine yazma
  // İdempotent: birden fazla çağrılsa bile duplikat oluşmaz
  const batch = writeBatch(db);
  DEFAULT_CATEGORIES.forEach((cat) => {
    const ref = doc(db, COLLECTION, cat.id);
    const { id, ...rest } = cat;
    batch.set(ref, {
      ...rest,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();
}

/** Mevcut duplikat kayıtları temizler (aynı isimden birden fazlası varsa siler) */
export async function cleanupDuplicateCategories(): Promise<void> {
  const all = await getCategories();
  const seen = new Map<string, string>(); // name → id (ilk görülen kalır)
  const toDelete: string[] = [];

  for (const cat of all) {
    const key = cat.name.toLowerCase().trim();
    if (seen.has(key)) {
      // Eğer default ID değilse sil, default ID ise öncekini sil
      const existingId = seen.get(key)!;
      const isCurrentDefault = DEFAULT_CATEGORIES.some(d => d.id === cat.id);
      const isExistingDefault = DEFAULT_CATEGORIES.some(d => d.id === existingId);

      if (isCurrentDefault && !isExistingDefault) {
        toDelete.push(existingId);
        seen.set(key, cat.id);
      } else {
        toDelete.push(cat.id);
      }
    } else {
      seen.set(key, cat.id);
    }
  }

  if (toDelete.length > 0) {
    const batch = writeBatch(db);
    toDelete.forEach(id => batch.delete(doc(db, COLLECTION, id)));
    await batch.commit();
  }
}

export async function addCategory(
  data: Omit<PersonCategory, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<PersonCategory, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
