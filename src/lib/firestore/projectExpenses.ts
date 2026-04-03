import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProjectExpense } from "@/types";

const COL = "projectExpenses";

function stripUndefined(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

function toExpense(data: Record<string, unknown>, id: string): ProjectExpense {
  return {
    id,
    projectId: data.projectId as string,
    description: (data.description as string) || "",
    cost: (data.cost as number) || 0,
    chargeToClient: (data.chargeToClient as number) || 0,
    isPaid: Boolean(data.isPaid),
    paidDate: data.paidDate as string | undefined,
    notes: data.notes as string | undefined,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getAllExpenses(): Promise<ProjectExpense[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => toExpense(d.data() as Record<string, unknown>, d.id));
}

export async function getExpenses(projectId: string): Promise<ProjectExpense[]> {
  const q = query(collection(db, COL), where("projectId", "==", projectId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => toExpense(d.data() as Record<string, unknown>, d.id))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function addExpense(
  data: Omit<ProjectExpense, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...stripUndefined(data as unknown as Record<string, unknown>),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<ProjectExpense, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...stripUndefined(data as unknown as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
