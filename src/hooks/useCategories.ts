"use client";

import { useEffect, useState, useCallback } from "react";
import { PersonCategory } from "@/types";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories,
  cleanupDuplicateCategories,
} from "@/lib/firestore/categories";
import toast from "react-hot-toast";

/** Firebase kurallarÄ± deploy edilmemiÅŸse veya yÃ¼kleme baÅŸarÄ±sÄ±z olursa kullanÄ±lÄ±r */
const FALLBACK_CATEGORIES: PersonCategory[] = [
  {
    id: "cat-isveren",
    name: "Ä°ÅŸveren",
    color: "#6366f1",
    isDefault: true,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cat-muellif",
    name: "MÃ¼ellif",
    color: "#0ea5e9",
    isDefault: true,
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cat-musteri",
    name: "MÃ¼ÅŸteri",
    color: "#10b981",
    isDefault: true,
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cat-tedarikci",
    name: "TedarikÃ§i",
    color: "#f59e0b",
    isDefault: true,
    order: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function useCategories() {
  const [categories, setCategories] = useState<PersonCategory[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Ã–nce duplikatlarÄ± temizle, sonra seed yap
      await cleanupDuplicateCategories();
      await seedDefaultCategories();
      const data = await getCategories();
      if (data.length > 0) {
        setCategories(data);
      }
      // EÄŸer Firestore boÅŸ dÃ¶nerse fallback kalÄ±r
    } catch (err) {
      console.error("Kategoriler yÃ¼klenemedi:", err);
      // Firebase kurallarÄ± yoksa fallback kategoriler gÃ¶rÃ¼nÃ¼r, sessizce geÃ§
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (
    data: Omit<PersonCategory, "id" | "createdAt" | "updatedAt">
  ) => {
    await addCategory(data);
    toast.success("Kategori eklendi");
    await load();
  };

  const update = async (
    id: string,
    data: Partial<Omit<PersonCategory, "id" | "createdAt" | "updatedAt">>
  ) => {
    await updateCategory(id, data);
    toast.success("Kategori gÃ¼ncellendi");
    await load();
  };

  const remove = async (id: string) => {
    await deleteCategory(id);
    toast.success("Kategori silindi");
    await load();
  };

  return { categories, loading, add, update, remove, reload: load };
}
