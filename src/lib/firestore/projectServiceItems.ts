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
import { ProjectServiceItem, ServiceItemStatus, PaymentInstallment, DEFAULT_SERVICE_NAMES } from "@/types";

const COL = "projectServiceItems";

function stripUndefined(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

function toInstallments(raw: unknown): PaymentInstallment[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: Record<string, unknown>) => ({
    id: (item.id as string) || Math.random().toString(36).slice(2),
    amount: (item.amount as number) || 0,
    isPaid: Boolean(item.isPaid),
    dueDate: item.dueDate as string | undefined,
    paidDate: item.paidDate as string | undefined,
    notes: item.notes as string | undefined,
  }));
}

function toServiceItem(data: Record<string, unknown>, id: string): ProjectServiceItem {
  return {
    id,
    projectId: data.projectId as string,
    serviceName: data.serviceName as string,
    muellif: data.muellif as string | undefined,
    cost: (data.cost as number) || 0,
    plannedPaymentDate: data.plannedPaymentDate as string | undefined,
    actualPaymentDate: data.actualPaymentDate as string | undefined,
    paymentInstallments: toInstallments(data.paymentInstallments),
    status: (data.status as ServiceItemStatus) || "not_started",
    notes: data.notes as string | undefined,
    order: (data.order as number) || 0,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getServiceItems(projectId: string): Promise<ProjectServiceItem[]> {
  const q = query(collection(db, COL), where("projectId", "==", projectId));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) =>
    toServiceItem(d.data() as Record<string, unknown>, d.id)
  );
  return items.sort((a, b) => a.order - b.order);
}

/** Yeni proje oluşturulduğunda standart hizmet satırlarını toplu ekler */
export async function createDefaultServiceItems(projectId: string): Promise<void> {
  const batch = writeBatch(db);
  DEFAULT_SERVICE_NAMES.forEach((name, i) => {
    const ref = doc(collection(db, COL));
    batch.set(ref, {
      projectId,
      serviceName: name,
      cost: 0,
      status: "not_started",
      order: i + 1,
      paymentInstallments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function addServiceItem(
  data: Omit<ProjectServiceItem, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...stripUndefined(data as unknown as Record<string, unknown>),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateServiceItem(
  id: string,
  data: Partial<Omit<ProjectServiceItem, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...stripUndefined(data as unknown as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteServiceItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

/** Tüm projeyle birlikte hizmet kalemlerini de siler */
export async function deleteAllServiceItems(projectId: string): Promise<void> {
  const items = await getServiceItems(projectId);
  const batch = writeBatch(db);
  items.forEach((item) => batch.delete(doc(db, COL, item.id)));
  await batch.commit();
}
