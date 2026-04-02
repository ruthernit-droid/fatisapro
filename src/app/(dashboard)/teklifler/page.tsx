"use client";

import { useState } from "react";
import { FileText, Eye, X, ExternalLink } from "lucide-react";

const TEMPLATES = [
  {
    id: 1,
    name: "Dark Luxury",
    desc: "Koyu zemin, altın vurgular. Prestijli, çarpıcı tasarım.",
    accent: "from-neutral-900 to-neutral-800",
    badge: "bg-yellow-500/20 text-yellow-400",
    src: "/quote-templates/template1.html",
  },
  {
    id: 2,
    name: "Classic White",
    desc: "Beyaz zemin, mavi vurgular. Kurumsal ve güven veren.",
    accent: "from-blue-50 to-white border border-blue-100",
    badge: "bg-blue-100 text-blue-700",
    src: "/quote-templates/template2.html",
  },
  {
    id: 3,
    name: "Modern Geometric",
    desc: "Yeşil/teal vurgular, geometrik öğeler. Çağdaş ve dinamik.",
    accent: "from-emerald-50 to-white border border-emerald-100",
    badge: "bg-emerald-100 text-emerald-700",
    src: "/quote-templates/template3.html",
  },
];

export default function TekliflerPage() {
  const [preview, setPreview] = useState<(typeof TEMPLATES)[0] | null>(null);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Teklifler</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Şablon seçin, düzenleyin ve PDF olarak kaydedin
          </p>
        </div>
      </div>

      {/* Template Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {TEMPLATES.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Preview thumbnail */}
            <div
              className={`h-36 bg-gradient-to-br ${t.accent} flex items-center justify-center`}
            >
              <div className="text-center">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-40 text-neutral-600" />
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${t.badge}`}
                >
                  {t.name}
                </span>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold text-neutral-800 mb-1">
                Şablon {t.id}: {t.name}
              </p>
              <p className="text-xs text-neutral-500 mb-4">{t.desc}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreview(t)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold py-2 hover:bg-indigo-700 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Önizle &amp; Düzenle
                </button>
                <a
                  href={t.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center rounded-lg border border-neutral-200 px-2.5 py-2 text-neutral-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                  title="Yeni sekmede aç"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info callout */}
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 flex gap-3">
        <FileText className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-indigo-800 mb-1">
            Şablonlar nasıl çalışır?
          </p>
          <p className="text-xs text-indigo-600 leading-relaxed">
            &ldquo;Önizle &amp; Düzenle&rdquo; ile tam boyutlu canlı önizleme açılır. Sağ panelden logo,
            firma adı, müşteri ve teklif No girin. Sütunları isteğe göre gizleyin,
            fiyatları tek tıkla saklayın. Hazır olunca <strong>PDF Olarak Kaydet</strong> ile
            doğrudan PDF çıktısı alın.
          </p>
        </div>
      </div>

      {/* Full-screen preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-neutral-900">
          <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-800 border-b border-neutral-700 shrink-0">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white">
                Şablon {preview.id}: {preview.name}
              </span>
              <span className="text-xs text-neutral-400">
                — Sağ panel ile düzenleyin, PDF Kaydet ile çıktı alın
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={preview.src}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Yeni Sekmede
              </a>
              <button
                onClick={() => setPreview(null)}
                className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                <X className="h-4 w-4" />
                Kapat
              </button>
            </div>
          </div>
          <iframe
            src={preview.src}
            className="flex-1 w-full border-0"
            title={`Teklif Şablonu ${preview.id}`}
          />
        </div>
      )}
    </div>
  );
}
