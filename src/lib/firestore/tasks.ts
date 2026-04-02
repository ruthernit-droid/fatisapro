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
import { Task, TaskStatus } from "@/types";

const COL = "tasks";

function toTask(data: Record<string, unknown>, id: string): Task {
  return {
    id,
    projectId: data.projectId as string | undefined,
    title: data.title as string,
    description: data.description as string | undefined,
    status: (data.status as TaskStatus) || "todo",
    priority: (data.priority as Task["priority"]) || "medium",
    assignedPersonId: data.assignedPersonId as string | undefined,
    dueDate: (data.dueDate as Timestamp)?.toDate(),
    completedDate: (data.completedDate as Timestamp)?.toDate(),
    tags: (data.tags as string[]) || [],
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function getTasks(projectId?: string): Promise<Task[]> {
  let q;
  if (projectId) {
    q = query(collection(db, COL), where("projectId", "==", projectId), orderBy("createdAt", "desc"));
  } else {
    q = query(collection(db, COL), orderBy("createdAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => toTask(d.data() as Record<string, unknown>, d.id));
}

export async function addTask(
  data: Omit<Task, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTask(
  id: string,
  data: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
