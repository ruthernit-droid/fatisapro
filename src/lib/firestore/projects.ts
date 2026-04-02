import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Project, ProjectStatus } from "@/types";

const COL = "projects";

function stripUndefined(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

function toProject(data: Record<string, unknown>, id: string): Project {
  return {
    id,
    title: data.title as string,
    projectNo: data.projectNo as string | undefined,
    description: data.description as string | undefined,
    type: data.type as Project["type"],
    status: (data.status as ProjectStatus) || "active",
    clientId: data.clientId as string,
    neighborhood: data.neighborhood as string | undefined,
    parcel: data.parcel as string | undefined,
    address: data.address as string | undefined,
    contractAmount: data.contractAmount as number | undefined,
    currency: "TRY",
    startDate: (data.startDate as Timestamp)?.toDate(),
    deadlineDate: (data.deadlineDate as Timestamp)?.toDate(),
    completedDate: (data.completedDate as Timestamp)?.toDate(),
    notes: data.notes as string | undefined,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getProjects(status?: ProjectStatus): Promise<Project[]> {
  let q;
  if (status) {
    q = query(collection(db, COL), where("status", "==", status), orderBy("createdAt", "desc"));
  } else {
    q = query(collection(db, COL), orderBy("createdAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => toProject(d.data() as Record<string, unknown>, d.id));
}

export async function getProject(id: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return toProject(snap.data() as Record<string, unknown>, snap.id);
}

export async function addProject(
  data: Omit<Project, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...stripUndefined(data as unknown as Record<string, unknown>),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProject(
  id: string,
  data: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...stripUndefined(data as unknown as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
