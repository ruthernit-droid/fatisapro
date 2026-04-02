"use client";

import { useState, useEffect } from "react";
import { FileText, Eye, X, ExternalLink, FolderOpen, Clock, CheckCircle, XCircle } from "lucide-react";
import { getQuotes } from "@/lib/firestore/quotes";
import { Quote } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const TEMPLATES = [
  {
    id: 1,
    name: "Dark Luxury",
    desc: "Koyu zemin, altÄ±n vurgular. Prestijli tasarÄ±m.",
    accent: "from-neutral-900 to-neutral-800",
    badge: "bg-yellow-500/20 text-yellow-400",
    src: "/quote-templates/template1.html",
  },
  {
    id: 2,
    name: "Classic White",
    desc: "Beyaz zemin, mavi vurgular. Kurumsal.",
    accent: "from-blue-50 to-white border border-blue-100",
    badge: "bg-blue-100 text-blue-700",
    src: "/quote-templates/template2.html",
  },
  {
    id: 3,
    name: "Modern Geometric",
    desc: "YeÅŸil/teal vurgular, geometrik Ã¶ÄŸeler.",
    accent: "from-emerald-50 to-white border border-emerald-100",
    badge: "bg-emerald-100 text-emerald-700",
    src: "/quote-templates/template3.html",
  },
];

const STATUS_LABELS: Record<string, string> = {
  draft: "Taslak", sent: "GÃ¶nderildi", accepted: "Kabul Edildi",
  rejected: "Reddedildi", expired: "SÃ¼resi Doldu",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  expired: "bg-neutral-100 text-neutral-400",
};

export default function TekliflerPage() {
  const [preview, setPreview] = useState<(typeof TEMPLATES)[0] | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  useEffect(() => {
    getQuotes()
      .then(setQuotes)
      .catch(() => toast.error("Teklifler yÃ¼klenemedi"))
      .finally(() => setLoadingQuotes(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Teklifler</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Proje teklifleri ve boÅŸ ÅŸablonlar
        </p>
      </div>

      {/* â”€â”€ Saved Quotes from Projects â”€â”€ */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-indigo-500" />
          Proje Teklifleri
        </h2>
        {loadingQuotes ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-neutral-200 py-10 text-center">
            <FileText className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
            <p className="text-sm text-neutral-500 font-medium">HenÃ¼z teklif oluÅŸturulmadÄ±</p>
            <p className="text-xs text-neutral-400 mt-1">
              Proje detayÄ±nda &ldquo;Teklif GÃ¶nder&rdquo; butonunu kullanarak teklif hazÄ±rlayÄ±n.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            <div className="divide-y divide-neutral-100">
              {quotes.map((q) => (
                <div key={q.id} className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 shrink-0">
                    <FileText className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-800 truncate">{q.title}</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[q.status])}>
                        {STATUS_LABELS[q.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-neutral-500">{q.quoteNo}</span>
                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <Clock className="h-3 w-3" />
                        {q.createdAt.toLocaleDateString("tr-TR")}
                      </span>
                      <span className="text-xs font-medium text-neutral-700">
                        {q.grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} â‚º
                      </span>
                    </div>
                  </div>
                  {q.projectId && (
                    <Link
                      href={`/teklifler/${q.projectId}`}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Tekrar AÃ§
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* â”€â”€ Blank Templates â”€â”€ */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-neutral-500" />
          BoÅŸ Åablonlar
          <span className="text-xs text-neutral-400 font-normal">(manuel doldurulabilir)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`h-28 bg-gradient-to-br ${t.accent} flex items-center justify-center`}>
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40 text-neutral-600" />
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${t.badge}`}>
                    {t.name}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-neutral-800 mb-1">Åablon {t.id}: {t.name}</p>
                <p className="text-xs text-neutral-500 mb-3">{t.desc}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreview(t)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold py-1.5 hover:bg-indigo-700 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ã–nizle
                  </button>
                  <a
                    href={t.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-lg border border-neutral-200 px-2 py-1.5 text-neutral-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                    title="Yeni sekmede aÃ§"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-400 mt-3">
          Proje verilerinden otomatik teklif oluÅŸturmak iÃ§in proje detayÄ±nda &ldquo;Teklif GÃ¶nder&rdquo; butonunu kullanÄ±n.
        </p>
      </div>

      {/* Full-screen preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-neutral-900">
          <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-800 border-b border-neutral-700 shrink-0">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white">
                Åablon {preview.id}: {preview.name}
              </span>
              <span className="text-xs text-neutral-400">â€” SaÄŸ panelden dÃ¼zenleyin</span>
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
            title={`Teklif Åablonu ${preview.id}`}
          />
        </div>
      )}
    </div>
  );
}
