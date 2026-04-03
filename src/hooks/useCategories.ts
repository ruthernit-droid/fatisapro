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

/** Firebase kuralları deploy edilmemişse veya yükleme başarısız olursa kullanılır */
const FALLBACK_CATEGORIES: PersonCategory[] = [
  {
    id: "cat-isveren",
    name: "İşveren",
    color: "#6366f1",
    isDefault: true,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cat-muellif",
    name: "Müellif",
    color: "#0ea5e9",
    isDefault: true,
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cat-musteri",
    name: "Müşteri",
    color: "#10b981",
    isDefault: true,
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cat-tedarikci",
    name: "Tedarikçi",
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
      // Önce duplikatları temizle, sonra seed yap
      await cleanupDuplicateCategories();
      await seedDefaultCategories();
      const data = await getCategories();
      if (data.length > 0) {
        setCategories(data);
      }
      // Eğer Firestore boş dönerse fallback kalır
    } catch (err) {
      console.error("Kategoriler yüklenemedi:", err);
      // Firebase kuralları yoksa fallback kategoriler görünür, sessizce geç
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
    toast.success("Kategori güncellendi");
    await load();
  };

  const remove = async (id: string) => {
    await deleteCategory(id);
    toast.success("Kategori silindi");
    await load();
  };

  return { categories, loading, add, update, remove, reload: load };
}
