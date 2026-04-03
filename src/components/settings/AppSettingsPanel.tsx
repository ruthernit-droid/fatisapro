"use client";

import { useAppSettings } from "@/hooks/useAppSettings";
import { AppSettings } from "@/types";
import { SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-neutral-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          checked ? "bg-indigo-600" : "bg-neutral-200"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function AppSettingsPanel() {
  const { appSettings, loading, saving, save } = useAppSettings();

  async function handleToggle(key: keyof Omit<AppSettings, "updatedAt" | "kdvRate">, value: boolean) {
    try {
      await save({ [key]: value });
      toast.success("Ayar kaydedildi");
    } catch {
      toast.error("Kaydedilemedi");
    }
  }

  async function handleKdvRate(e: React.ChangeEvent<HTMLInputElement>) {
    const rate = parseFloat(e.target.value);
    if (isNaN(rate) || rate < 0 || rate > 100) return;
    try {
      await save({ kdvRate: rate });
      toast.success("KDV oranı kaydedildi");
    } catch {
      toast.error("Kaydedilemedi");
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-sm text-neutral-400">Yükleniyor...</div>;
  }

  if (!appSettings) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-neutral-800 flex items-center gap-2 mb-4">
        <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
        Uygulama Davranış Ayarları
      </h2>

      {/* KDV */}
      <div className="space-y-0">
        <Toggle
          label="KDV Hesapla"
          description="Fiyatlara KDV ekle ve raporlarda göster"
          checked={appSettings.kdvEnabled}
          onChange={(v) => handleToggle("kdvEnabled", v)}
        />
        {appSettings.kdvEnabled && (
          <div className="flex items-center gap-3 py-2 pl-4 border-b border-neutral-100">
            <label className="text-sm text-neutral-600 w-24">KDV Oranı (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              defaultValue={appSettings.kdvRate}
              onBlur={handleKdvRate}
              className="w-20 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
              disabled={saving}
            />
          </div>
        )}
        <Toggle
          label="Tekliflerde Maliyeti Göster"
          description="Teklif şablonlarında hizmet kalemi birim fiyatlarını göster"
          checked={appSettings.showCostInQuotes}
          onChange={(v) => handleToggle("showCostInQuotes", v)}
        />
      </div>

      <p className="text-xs text-neutral-400 mt-4">
        Varsayılan: KDV kapalı, teklif maliyetleri gizli.
      </p>
    </div>
  );
}
