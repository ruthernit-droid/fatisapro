import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Quote, QuoteItem } from "@/types";

function toQuote(id: string, data: Record<string, unknown>): Quote {
  return {
    id,
    projectId: data.projectId as string | undefined,
    personId: (data.personId as string) || "",
    quoteNo: (data.quoteNo as string) || "",
    title: (data.title as string) || "",
    items: (data.items as QuoteItem[]) || [],
    subtotal: (data.subtotal as number) || 0,
    grandTotal: (data.grandTotal as number) || 0,
    currency: "TRY",
    status: (data.status as Quote["status"]) || "draft",
    validUntil: data.validUntil
      ? (data.validUntil as Timestamp).toDate()
      : undefined,
    notes: data.notes as string | undefined,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getQuotes(): Promise<Quote[]> {
  const snap = await getDocs(
    query(collection(db, "quotes"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => toQuote(d.id, d.data()));
}

export async function getQuotesByProject(projectId: string): Promise<Quote[]> {
  const snap = await getDocs(
    query(
      collection(db, "quotes"),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc")
    )
  );
  return snap.docs.map((d) => toQuote(d.id, d.data()));
}

export async function addQuote(
  data: Omit<Quote, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "quotes"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateQuote(
  id: string,
  data: Partial<Omit<Quote, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "quotes", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteQuote(id: string): Promise<void> {
  await deleteDoc(doc(db, "quotes", id));
}
