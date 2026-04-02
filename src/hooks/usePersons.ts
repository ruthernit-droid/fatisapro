"use client";

import { useEffect, useState, useCallback } from "react";
import { Person } from "@/types";
import {
  getPersons,
  addPerson,
  updatePerson,
  deletePerson,
} from "@/lib/firestore/persons";
import toast from "react-hot-toast";

export function usePersons() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPersons();
      setPersons(data);
    } catch {
      toast.error("Kişiler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (data: Omit<Person, "id" | "createdAt" | "updatedAt">) => {
    try {
      await addPerson(data);
      toast.success("Kişi eklendi");
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      console.error("Kişi eklenemedi:", err);
      toast.error(`Kişi eklenemedi: ${msg}`);
      throw err; // dialog'un kapanmaması için yeniden fırlat
    }
  };

  const update = async (
    id: string,
    data: Partial<Omit<Person, "id" | "createdAt" | "updatedAt">>
  ) => {
    try {
      await updatePerson(id, data);
      toast.success("Kişi güncellendi");
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      console.error("Kişi güncellenemedi:", err);
      toast.error(`Kişi güncellenemedi: ${msg}`);
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      await deletePerson(id);
      toast.success("Kişi silindi");
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      console.error("Kişi silinemedi:", err);
      toast.error(`Kişi silinemedi: ${msg}`);
    }
  };

  return { persons, loading, add, update, remove, reload: load };
}
