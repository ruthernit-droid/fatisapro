import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TufanTransaction, TufanTransactionType, TufanTransactionCategory } from "@/types";

const COL = "tufanTransactions";

function strip(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

function toTx(data: Record<string, unknown>, id: string): TufanTransaction {
  return {
    id,
    personId: data.personId as string | undefined,
    personName: data.personName as string | undefined,
    type: data.type as TufanTransactionType,
    category: data.category as TufanTransactionCategory,
    amount: data.amount as number,
    description: data.description as string,
    date: (data.date as Timestamp)?.toDate() || new Date(),
    dueDate: (data.dueDate as Timestamp)?.toDate(),
    isPaid: (data.isPaid as boolean) ?? false,
    paidDate: (data.paidDate as Timestamp)?.toDate(),
    notes: data.notes as string | undefined,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getTufanTransactions(): Promise<TufanTransaction[]> {
  const q = query(collection(db, COL), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toTx(d.data() as Record<string, unknown>, d.id));
}

export async function addTufanTransaction(
  data: Omit<TufanTransaction, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), strip({
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  return ref.id;
}

export async function updateTufanTransaction(
  id: string,
  data: Partial<Omit<TufanTransaction, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), strip({ ...data, updatedAt: serverTimestamp() }));
}

export async function deleteTufanTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
