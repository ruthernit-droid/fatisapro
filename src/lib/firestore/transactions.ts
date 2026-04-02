import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Transaction, TransactionType } from "@/types";

const COL = "transactions";

function toTransaction(data: Record<string, unknown>, id: string): Transaction {
  return {
    id,
    projectId: data.projectId as string | undefined,
    personId: data.personId as string | undefined,
    type: data.type as TransactionType,
    category: data.category as Transaction["category"],
    amount: data.amount as number,
    description: data.description as string,
    date: (data.date as Timestamp)?.toDate() || new Date(),
    invoiceNo: data.invoiceNo as string | undefined,
    isPaid: (data.isPaid as boolean) ?? false,
    paidDate: (data.paidDate as Timestamp)?.toDate(),
    notes: data.notes as string | undefined,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getTransactions(projectId?: string): Promise<Transaction[]> {
  let q;
  if (projectId) {
    q = query(collection(db, COL), where("projectId", "==", projectId), orderBy("date", "desc"));
  } else {
    q = query(collection(db, COL), orderBy("date", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => toTransaction(d.data() as Record<string, unknown>, d.id));
}

export async function addTransaction(
  data: Omit<Transaction, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

/** Özet: Proje veya genel gelir/gider toplamları */
export async function getFinancialSummary(projectId?: string) {
  const transactions = await getTransactions(projectId);
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  return {
    income,
    expense,
    profit: income - expense,
    transactions,
  };
}
