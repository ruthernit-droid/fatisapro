"use client";

import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { useProjectTypes } from "@/hooks/useProjectTypes";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { ServiceCategoryManager } from "@/components/settings/ServiceCategoryManager";
import { ProjectTypeManager } from "@/components/settings/ProjectTypeManager";
import { CompanySettingsForm } from "@/components/settings/CompanySettings";
import { AppSettingsPanel } from "@/components/settings/AppSettingsPanel";
import { VeriDuzenlePanel } from "@/components/settings/VeriDuzenlePanel";
import { Settings, Building2, Layers, SlidersHorizontal, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "firma",       label: "Firma",    icon: Building2 },
  { id: "kategoriler", label: "Listeler", icon: Layers },
  { id: "uygulama",    label: "Uygulama", icon: SlidersHorizontal },
  { id: "duzelt",      label: "Düzelt",   icon: ShieldAlert },
] as const;

type TabId = typeof TABS[number]["id"];

/** Listeler sekmesi — kendi bağımsız hook'larıyla çalışır */
function KategorilerTab() {
  const { categories, loading: cLoading, add: cAdd, update: cUpdate, remove: cRemove } = useCategories();
  const { serviceCategories, loading: scLoading, add: scAdd, update: scUpdate, remove: scRemove } = useServiceCategories();
  const { projectTypes, loading: ptLoading, add: ptAdd, update: ptUpdate, remove: ptRemove } = useProjectTypes();

  return (
    <div className="space-y-5">
      {cLoading ? (
        <div className="py-4 text-center text-sm text-neutral-400">Yükleniyor...</div>
      ) : (
        <CategoryManager categories={categories} onAdd={cAdd} onUpdate={cUpdate} onDelete={cRemove} />
      )}
      {scLoading ? (
        <div className="py-4 text-center text-sm text-neutral-400">Yükleniyor...</div>
      ) : (
        <ServiceCategoryManager categories={serviceCategories} onAdd={scAdd} onUpdate={scUpdate} onDelete={scRemove} />
      )}
      {ptLoading ? (
        <div className="py-4 text-center text-sm text-neutral-400">Yükleniyor...</div>
      ) : (
        <ProjectTypeManager projectTypes={projectTypes} onAdd={ptAdd} onUpdate={ptUpdate} onDelete={ptRemove} />
      )}
    </div>
  );
}

export default function AyarlarPage() {
  const [activeTab, setActiveTab] = useState<TabId>("firma");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <Settings className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Ayarlar</h1>
          <p className="text-sm text-neutral-500">Firma ve uygulama ayarları</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Her sekme bağımsız render — birindeki hata diğerini etkilemez */}
      {activeTab === "firma" && <CompanySettingsForm />}
      {activeTab === "kategoriler" && <KategorilerTab />}
      {activeTab === "uygulama" && <AppSettingsPanel />}
      {activeTab === "duzelt" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-5">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold text-neutral-800">Veri Düzeltme</h2>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-5">
            <p className="text-xs text-amber-800 font-medium">
              ⚠️ Bu bölümdeki işlemler kalıcı ve geri alınamaz. Lütfen dikkatli kullanın.
            </p>
          </div>
          <VeriDuzenlePanel />
        </div>
      )}
    </div>
  );
}
