"use client";

import { useState, useEffect } from "react";
import { ProjectTypeItem } from "@/types";
import {
  getProjectTypes,
  addProjectType,
  updateProjectType,
  deleteProjectType,
  seedDefaultProjectTypes,
} from "@/lib/firestore/projectTypes";

export function useProjectTypes() {
  const [projectTypes, setProjectTypes] = useState<ProjectTypeItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      await seedDefaultProjectTypes();
      const types = await getProjectTypes();
      setProjectTypes(types);
    } catch (e) {
      console.error("useProjectTypes load error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function add(data: Omit<ProjectTypeItem, "id" | "createdAt" | "updatedAt">) {
    await addProjectType(data);
    await load();
  }

  async function update(id: string, data: Partial<Omit<ProjectTypeItem, "id" | "createdAt" | "updatedAt">>) {
    await updateProjectType(id, data);
    await load();
  }

  async function remove(id: string) {
    await deleteProjectType(id);
    await load();
  }

  return { projectTypes, loading, add, update, remove };
}
