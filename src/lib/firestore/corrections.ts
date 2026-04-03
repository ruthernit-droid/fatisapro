/**
 * Veri Düzeltme / Cascade İşlemleri
 * Yanlış kaydedilmiş verileri düzeltmek veya silmek için kullanılır.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ---------------------------------------------------------------------------
// Cascade Delete: Projeyi tüm bağlı verileriyle sil
// ---------------------------------------------------------------------------

export interface CascadePreview {
  projectTitle: string;
  serviceItemsCount: number;
  paymentPlansCount: number;
  expensesCount: number;
  quotesCount: number;
}

export async function getProjectCascadePreview(projectId: string): Promise<CascadePreview> {
  const [projectSnap, siSnap, ppSnap, expSnap, qSnap] = await Promise.all([
    getDoc(doc(db, "projects", projectId)),
    getDocs(query(collection(db, "projectServiceItems"), where("projectId", "==", projectId))),
    getDocs(query(collection(db, "projectPaymentPlans"), where("projectId", "==", projectId))),
    getDocs(query(collection(db, "projectExpenses"), where("projectId", "==", projectId))),
    getDocs(query(collection(db, "quotes"), where("projectId", "==", projectId))),
  ]);

  if (!projectSnap.exists()) throw new Error("Proje bulunamadı");

  const data = projectSnap.data() as Record<string, unknown>;
  return {
    projectTitle: (data.title as string) || "—",
    serviceItemsCount: siSnap.size,
    paymentPlansCount: ppSnap.size,
    expensesCount: expSnap.size,
    quotesCount: qSnap.size,
  };
}

export async function deleteProjectWithCascade(projectId: string): Promise<CascadePreview> {
  const preview = await getProjectCascadePreview(projectId);

  // Firestore batch: max 500 ops — for typical projects this is well within limit
  const batch = writeBatch(db);

  const [siSnap, ppSnap, expSnap, qSnap] = await Promise.all([
    getDocs(query(collection(db, "projectServiceItems"), where("projectId", "==", projectId))),
    getDocs(query(collection(db, "projectPaymentPlans"), where("projectId", "==", projectId))),
    getDocs(query(collection(db, "projectExpenses"), where("projectId", "==", projectId))),
    getDocs(query(collection(db, "quotes"), where("projectId", "==", projectId))),
  ]);

  siSnap.docs.forEach(d => batch.delete(d.ref));
  ppSnap.docs.forEach(d => batch.delete(d.ref));
  expSnap.docs.forEach(d => batch.delete(d.ref));
  qSnap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, "projects", projectId));

  await batch.commit();
  return preview;
}

// ---------------------------------------------------------------------------
// Ödeme Planı Kalemi: Ödenmedi olarak işaretle
// ---------------------------------------------------------------------------

export async function markPaymentPlanItemUnpaid(planId: string): Promise<void> {
  await updateDoc(doc(db, "projectPaymentPlans", planId), {
    isPaid: false,
    paidAmount: 0,
    paidDate: null,
    updatedAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Hizmet Kalemi Taksiti: Ödenmedi olarak işaretle
// ---------------------------------------------------------------------------

export async function markServiceInstallmentUnpaid(
  serviceItemId: string,
  installmentId: string
): Promise<void> {
  const snap = await getDoc(doc(db, "projectServiceItems", serviceItemId));
  if (!snap.exists()) throw new Error("Hizmet kalemi bulunamadı");

  const data = snap.data() as Record<string, unknown>;
  const installments = (data.paymentInstallments as Array<Record<string, unknown>>) || [];

  const updated = installments.map((inst) => {
    if (inst.id === installmentId) {
      return { ...inst, isPaid: false, paidDate: null };
    }
    return inst;
  });

  await updateDoc(doc(db, "projectServiceItems", serviceItemId), {
    paymentInstallments: updated,
    updatedAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Hizmet Kalemi Maliyeti: Düzelt
// ---------------------------------------------------------------------------

export async function fixServiceItemCost(serviceItemId: string, newCost: number): Promise<void> {
  await updateDoc(doc(db, "projectServiceItems", serviceItemId), {
    cost: newCost,
    updatedAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Teklifi Sil
// ---------------------------------------------------------------------------

export async function deleteQuoteCorrection(quoteId: string): Promise<void> {
  await deleteDoc(doc(db, "quotes", quoteId));
}
