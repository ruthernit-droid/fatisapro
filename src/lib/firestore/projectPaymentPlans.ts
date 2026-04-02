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
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProjectPaymentPlan } from "@/types";

const COL = "projectPaymentPlans";

function stripUndefined(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

function toPaymentPlan(data: Record<string, unknown>, id: string): ProjectPaymentPlan {
  return {
    id,
    projectId: data.projectId as string,
    title: data.title as string,
    amount: (data.amount as number) || 0,
    dueDate: data.dueDate as string | undefined,
    paidAmount: (data.paidAmount as number) || 0,
    paidDate: data.paidDate as string | undefined,
    isPaid: Boolean(data.isPaid),
    notes: data.notes as string | undefined,
    order: (data.order as number) || 0,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getPaymentPlans(projectId: string): Promise<ProjectPaymentPlan[]> {
  const q = query(collection(db, COL), where("projectId", "==", projectId));
  const snap = await getDocs(q);
  const plans = snap.docs.map((d) =>
    toPaymentPlan(d.data() as Record<string, unknown>, d.id)
  );
  return plans.sort((a, b) => a.order - b.order);
}

export async function addPaymentPlan(
  data: Omit<ProjectPaymentPlan, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...stripUndefined(data as unknown as Record<string, unknown>),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePaymentPlan(
  id: string,
  data: Partial<Omit<ProjectPaymentPlan, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...stripUndefined(data as unknown as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePaymentPlan(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function deleteAllPaymentPlans(projectId: string): Promise<void> {
  const plans = await getPaymentPlans(projectId);
  const batch = writeBatch(db);
  plans.forEach((p) => batch.delete(doc(db, COL, p.id)));
  await batch.commit();
}
