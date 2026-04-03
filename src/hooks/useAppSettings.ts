"use client";

import { useState, useEffect } from "react";
import { AppSettings } from "@/types";
import { getAppSettings, saveAppSettings } from "@/lib/firestore/settings";

export function useAppSettings() {
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAppSettings()
      .then(setAppSettings)
      .catch((e) => console.error("useAppSettings load error:", e))
      .finally(() => setLoading(false));
  }, []);

  async function save(data: Partial<Omit<AppSettings, "updatedAt">>) {
    setSaving(true);
    try {
      await saveAppSettings(data);
      setAppSettings((prev) => prev ? { ...prev, ...data } : null);
    } finally {
      setSaving(false);
    }
  }

  return { appSettings, loading, saving, save };
}
