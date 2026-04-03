"use client";

import { useState, useEffect } from "react";
import { ServiceCategory } from "@/types";
import {
  getServiceCategories,
  addServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  seedDefaultServiceCategories,
} from "@/lib/firestore/serviceCategories";

export function useServiceCategories() {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      await seedDefaultServiceCategories();
      const cats = await getServiceCategories();
      setServiceCategories(cats);
    } catch (e) {
      console.error("useServiceCategories load error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // empty deps intentional — runs once on mount

  async function add(data: Omit<ServiceCategory, "id" | "createdAt" | "updatedAt">) {
    await addServiceCategory(data);
    await load();
  }

  async function update(id: string, data: Partial<Omit<ServiceCategory, "id" | "createdAt" | "updatedAt">>) {
    await updateServiceCategory(id, data);
    await load();
  }

  async function remove(id: string) {
    await deleteServiceCategory(id);
    await load();
  }

  return { serviceCategories, loading, add, update, remove };
}
