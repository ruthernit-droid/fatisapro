"use client";

import { useCategories } from "@/hooks/useCategories";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { CompanySettingsForm } from "@/components/settings/CompanySettings";
import { Settings } from "lucide-react";

export default function AyarlarPage() {
  const { categories, loading, add, update, remove } = useCategories();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <Settings className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Ayarlar</h1>
          <p className="text-sm text-neutral-500">Firma ve uygulama ayarları</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Company Settings */}
        <CompanySettingsForm />

        {/* Category Manager */}
        {!loading && (
          <CategoryManager
            categories={categories}
            onAdd={add}
            onUpdate={update}
            onDelete={remove}
          />
        )}
      </div>
    </div>
  );
}
