import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OzalitJob, OzalitServiceType, OzalitSize } from "@/types";

const COL = "ozalitJobs";

function strip(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

function toJob(data: Record<string, unknown>, id: string): OzalitJob {
  return {
    id,
    clientId: data.clientId as string | undefined,
    clientName: data.clientName as string | undefined,
    description: data.description as string,
    serviceType: data.serviceType as OzalitServiceType,
    paperSize: data.paperSize as OzalitSize,
    copies: data.copies as number,
    unitPrice: data.unitPrice as number,
    totalAmount: data.totalAmount as number,
    isPaid: (data.isPaid as boolean) ?? false,
    paidDate: data.paidDate as string | undefined,
    date: (data.date as Timestamp)?.toDate() || new Date(),
    notes: data.notes as string | undefined,
    syncToTransactions: (data.syncToTransactions as boolean) ?? true,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getOzalitJobs(): Promise<OzalitJob[]> {
  const q = query(collection(db, COL), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toJob(d.data() as Record<string, unknown>, d.id));
}

export async function addOzalitJob(
  data: Omit<OzalitJob, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), strip({
    ...data,
    date: data.date,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  return ref.id;
}

export async function updateOzalitJob(
  id: string,
  data: Partial<Omit<OzalitJob, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), strip({ ...data, updatedAt: serverTimestamp() }));
}

export async function deleteOzalitJob(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
