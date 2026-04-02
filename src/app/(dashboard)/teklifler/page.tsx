"use client";

import { FileText, Plus, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TekliflerPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Teklifler</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Teklif ve sözleşme yönetimi</p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4" />
          Yeni Teklif
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border-2 border-dashed border-neutral-200 bg-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 mb-4">
          <Construction className="h-7 w-7 text-indigo-400" />
        </div>
        <p className="text-base font-semibold text-neutral-700">Teklif modülü geliştiriliyor</p>
        <p className="text-sm text-neutral-400 mt-2 max-w-sm">
          PDF çıktısı alınabilen, farklı şablonlara sahip modern teklif
          ve sözleşme oluşturma modülü yakında hazır olacak.
        </p>
        <div className="mt-6 flex gap-2">
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-2 text-xs text-indigo-600 font-medium flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Teklif şablonları
          </div>
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-2 text-xs text-indigo-600 font-medium flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            PDF çıktısı
          </div>
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-2 text-xs text-indigo-600 font-medium flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Sözleşme
          </div>
        </div>
      </div>
    </div>
  );
}
