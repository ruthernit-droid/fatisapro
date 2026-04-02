"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProject, updateProject } from "@/lib/firestore/projects";
import { getServiceItems } from "@/lib/firestore/projectServiceItems";
import { getPersons } from "@/lib/firestore/persons";
import { getCompanySettings } from "@/lib/firestore/settings";
import { addQuote } from "@/lib/firestore/quotes";
import {
  Project,
  ProjectServiceItem,
  Person,
  CompanySettings,
  PROJECT_TYPE_LABELS,
} from "@/types";
import { ArrowLeft, Eye, EyeOff, Printer, Save, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { cn, formatCurrency } from "@/lib/utils";

function genQuoteNo() {
  const y = new Date().getFullYear();
  const n = Math.floor(Math.random() * 900 + 100);
  return `TKL-${y}-${n}`;
}

const PRINT_CSS = `
@media print {
  .no-print { display: none !important; }
  .print-page { box-shadow: none !important; }
  body { background: white !important; }
}
@media screen {
  .print-only { display: none !important; }
}
`;

export default function QuoteBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [serviceItems, setServiceItems] = useState<ProjectServiceItem[]>([]);
  const [client, setClient] = useState<Person | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  // Column visibility
  const [hideAmounts, setHideAmounts] = useState(false);
  const [showBirimFiyat, setShowBirimFiyat] = useState(false);
  const [showKdv, setShowKdv] = useState(true);
  const [kdvRate, setKdvRate] = useState(20);
  const [showTerms, setShowTerms] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const [notes, setNotes] = useState("");
  const [validDays] = useState(30);
  const [quoteNo] = useState(genQuoteNo);

  const loadData = useCallback(async () => {
    try {
      const [proj, items, persons, cfg] = await Promise.all([
        getProject(projectId),
        getServiceItems(projectId),
        getPersons(),
        getCompanySettings(),
      ]);
      if (!proj) { router.push("/teklifler"); return; }
      setProject(proj);
      setServiceItems(items);
      setClient(persons.find((p) => p.id === proj.clientId) || null);
      setSettings(cfg);
    } catch {
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }
  if (!project || !settings) return null;

  const subtotal = serviceItems.reduce((s, i) => s + (i.cost || 0), 0);
  const packagePrice = project.contractAmount || 0;
  const baseTotal = packagePrice > 0 ? packagePrice : subtotal;
  const kdvAmount = showKdv ? Math.round(baseTotal * (kdvRate / 100)) : 0;
  const grandTotal = baseTotal + kdvAmount;

  const today = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const validUntil = new Date(Date.now() + validDays * 86400000).toLocaleDateString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  async function handleSend() {
    setSaving(true);
    try {
      await addQuote({
        projectId,
        personId: project!.clientId,
        quoteNo,
        title: project!.title,
        items: serviceItems.map((item) => ({
          id: item.id,
          description: item.serviceName,
          quantity: 1,
          unit: "kalem",
          unitPrice: item.cost || 0,
          totalPrice: item.cost || 0,
        })),
        subtotal,
        grandTotal,
        currency: "TRY",
        status: "sent",
        notes: notes || undefined,
      });
      await updateProject(projectId, { status: "on_hold" });
      setSent(true);
      toast.success("Teklif kaydedildi — proje 'Beklemede' durumuna alındı");
    } catch {
      toast.error("Kayıt sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <style>{PRINT_CSS}</style>

      {/* ── Toolbar ── */}
      <div className="no-print sticky top-0 z-40 bg-white border-b border-neutral-200 px-6 py-2.5 flex items-center gap-3 flex-wrap">
        <Link href={`/projeler/${projectId}`} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Projeye Dön
        </Link>
        <div className="h-4 w-px bg-neutral-200" />
        <span className="text-sm font-semibold text-neutral-700">
          Teklif Hazırla — <span className="text-indigo-600">{project.title}</span>
        </span>
        <div className="flex-1" />

        {/* Column toggles */}
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer select-none">
            <input type="checkbox" checked={showBirimFiyat} onChange={(e) => setShowBirimFiyat(e.target.checked)} className="accent-indigo-600" />
            Birim Fiyat
          </label>
          <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer select-none">
            <input type="checkbox" checked={showKdv} onChange={(e) => setShowKdv(e.target.checked)} className="accent-indigo-600" />
            KDV
          </label>
          {showKdv && (
            <select
              value={kdvRate}
              onChange={(e) => setKdvRate(Number(e.target.value))}
              className="text-xs border border-neutral-200 rounded px-1.5 py-0.5 bg-white"
            >
              <option value={10}>%10</option>
              <option value={18}>%18</option>
              <option value={20}>%20</option>
            </select>
          )}
          <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer select-none">
            <input type="checkbox" checked={showTerms} onChange={(e) => setShowTerms(e.target.checked)} className="accent-indigo-600" />
            Ödeme Koşulları
          </label>
          <label className="flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer select-none">
            <input type="checkbox" checked={showSignature} onChange={(e) => setShowSignature(e.target.checked)} className="accent-indigo-600" />
            İmza
          </label>
        </div>

        <div className="h-4 w-px bg-neutral-200" />

        {/* Hide amounts toggle */}
        <button
          onClick={() => setHideAmounts(!hideAmounts)}
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors",
            hideAmounts
              ? "bg-amber-50 border-amber-400 text-amber-700"
              : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-400"
          )}
        >
          {hideAmounts ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {hideAmounts ? "Tutarlar Gizli (Sadece Toplam)" : "Kalem Tutarlarını Gizle"}
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-800 text-white hover:bg-neutral-900 transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
          PDF / Yazdır
        </button>

        {sent ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 px-2">
            <CheckCircle className="h-4 w-4" /> Teklif Gönderildi
          </span>
        ) : (
          <button
            onClick={handleSend}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Kaydediliyor..." : "Teklif Gönder ve Kaydet"}
          </button>
        )}
      </div>

      {/* ── Quote Document ── */}
      <div className="bg-neutral-100 min-h-screen py-8 px-4 print:p-0 print:bg-white">
        <div className="print-page bg-white max-w-4xl mx-auto shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none">

          {/* Header */}
          <div className="bg-neutral-900 text-white px-10 py-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                {settings.logoUrl && (
                  <img src={settings.logoUrl} alt="Logo" className="h-12 object-contain mb-3" />
                )}
                <h1 className="text-xl font-bold tracking-tight">{settings.name}</h1>
                {settings.address && (
                  <p className="text-sm text-neutral-400 mt-1 max-w-xs">{settings.address}</p>
                )}
                <div className="flex gap-4 mt-2 flex-wrap">
                  {settings.phone && <span className="text-xs text-neutral-400">{settings.phone}</span>}
                  {settings.email && <span className="text-xs text-neutral-400">{settings.email}</span>}
                  {settings.taxNumber && (
                    <span className="text-xs text-neutral-400">VKN: {settings.taxNumber}</span>
                  )}
                  {settings.taxOffice && (
                    <span className="text-xs text-neutral-400">{settings.taxOffice}</span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] tracking-[3px] uppercase text-neutral-400 mb-1">
                  Mimarlık Hizmet Teklifi
                </div>
                <div className="text-2xl font-bold text-indigo-400">{quoteNo}</div>
                <div className="text-xs text-neutral-400 mt-3">Tarih: {today}</div>
                <div className="text-xs text-neutral-400">Geçerlilik: {validUntil}</div>
              </div>
            </div>
          </div>

          {/* Client + Project */}
          <div className="grid grid-cols-2 border-b border-neutral-200">
            <div className="p-6 border-r border-neutral-200">
              <p className="text-[10px] font-semibold tracking-[2px] uppercase text-neutral-400 mb-2">
                Sayın
              </p>
              <p className="text-base font-bold text-neutral-900">{client?.name || "İşveren"}</p>
              {client?.phone && <p className="text-sm text-neutral-500 mt-1">{client.phone}</p>}
              {client?.email && <p className="text-sm text-neutral-500">{client.email}</p>}
              {(client as (Person & { address?: string }))?.address && (
                <p className="text-sm text-neutral-500">{(client as (Person & { address?: string })).address}</p>
              )}
            </div>
            <div className="p-6">
              <p className="text-[10px] font-semibold tracking-[2px] uppercase text-neutral-400 mb-2">
                Proje Bilgileri
              </p>
              <p className="text-base font-bold text-neutral-900">{project.title}</p>
              <p className="text-sm text-neutral-500 mt-1">{PROJECT_TYPE_LABELS[project.type]}</p>
              {project.neighborhood && (
                <p className="text-sm text-neutral-500">{project.neighborhood}</p>
              )}
              {project.parcel && (
                <p className="text-sm text-neutral-500">Ada/Parsel: {project.parcel}</p>
              )}
              {project.projectNo && (
                <p className="text-xs text-neutral-400 mt-1">Proje No: {project.projectNo}</p>
              )}
            </div>
          </div>

          {/* Service Items Table */}
          <div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-800 text-white">
                  <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider w-8">
                    #
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider">
                    Hizmet Açıklaması
                  </th>
                  {showBirimFiyat && (
                    <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-wider">
                      Birim Fiyat
                    </th>
                  )}
                  {!hideAmounts && (
                    <th className="text-right px-6 py-3 text-[10px] font-semibold uppercase tracking-wider">
                      Tutar
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {serviceItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-b border-neutral-100",
                      idx % 2 === 0 ? "bg-white" : "bg-neutral-50/60"
                    )}
                  >
                    <td className="px-6 py-3.5 text-xs text-neutral-400">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-neutral-800">{item.serviceName}</td>
                    {showBirimFiyat && (
                      <td className="px-4 py-3.5 text-right text-sm text-neutral-600">
                        {item.cost > 0 ? formatCurrency(item.cost) : "—"}
                      </td>
                    )}
                    {!hideAmounts && (
                      <td className="px-6 py-3.5 text-right font-semibold text-neutral-900">
                        {item.cost > 0 ? formatCurrency(item.cost) : "—"}
                      </td>
                    )}
                  </tr>
                ))}
                {serviceItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-neutral-400">
                      Bu projeye henüz hizmet kalemi eklenmemiş.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end px-6 py-5 border-t border-neutral-100">
            <div className="w-72 space-y-1">
              {/* Show item subtotal only if package price overrides it and amounts are visible */}
              {!hideAmounts && packagePrice > 0 && subtotal !== packagePrice && (
                <div className="flex justify-between py-2 border-b border-neutral-100 text-sm">
                  <span className="text-neutral-500">Kalemler Toplamı</span>
                  <span className="text-neutral-600">{formatCurrency(subtotal)}</span>
                </div>
              )}
              {!hideAmounts && (
                <div className="flex justify-between py-2 border-b border-neutral-100 text-sm">
                  <span className="text-neutral-500">
                    {packagePrice > 0 ? "Paket / Sözleşme Fiyatı" : "Ara Toplam"}
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {formatCurrency(baseTotal)}
                  </span>
                </div>
              )}
              {showKdv && (
                <div className="flex justify-between py-2 border-b border-neutral-100 text-sm">
                  <span className="text-neutral-500">KDV (%{kdvRate})</span>
                  <span className={cn("text-neutral-600", hideAmounts && "opacity-0 select-none")}>
                    {formatCurrency(kdvAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center bg-neutral-900 text-white rounded-lg px-4 py-3 mt-2">
                <span className="font-bold text-sm uppercase tracking-wide">Genel Toplam</span>
                <span className="font-bold text-xl">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes — editable in screen, plain text in print */}
          <div className="no-print px-6 pb-4">
            <label className="block text-[10px] font-semibold tracking-[2px] uppercase text-neutral-400 mb-1.5">
              Not / Teklif Açıklaması (isteğe bağlı)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-300 bg-neutral-50"
              placeholder="Teklif notları, özel koşullar..."
            />
          </div>
          {notes && (
            <div className="print-only px-6 pb-4 border-t border-neutral-100 pt-4">
              <p className="text-[10px] font-semibold tracking-[2px] uppercase text-neutral-400 mb-2">
                Notlar
              </p>
              <p className="text-sm text-neutral-600 leading-relaxed">{notes}</p>
            </div>
          )}

          {/* Payment Terms */}
          {showTerms && (
            <div className="border-t border-neutral-100 px-6 py-5">
              <p className="text-[10px] font-semibold tracking-[2px] uppercase text-neutral-400 mb-3">
                Ödeme Koşulları
              </p>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-bold shrink-0">→</span>
                  <span>Sözleşme imzalanması ile birlikte toplam bedelin %30&apos;u peşin alınır.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-bold shrink-0">→</span>
                  <span>Her aşama tesliminde kalan bedelin eşit taksitleri tahsil edilir.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-bold shrink-0">→</span>
                  <span>Bu teklif {validDays} gün geçerlidir.</span>
                </li>
                {settings.iban && (
                  <li className="flex gap-2">
                    <span className="text-indigo-500 font-bold shrink-0">→</span>
                    <span>IBAN: {settings.iban}{settings.bankName ? ` (${settings.bankName})` : ""}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Signatures */}
          {showSignature && (
            <div className="border-t border-neutral-100 px-6 py-5">
              <div className="grid grid-cols-2 gap-6">
                <div className="border border-neutral-200 rounded-lg p-4">
                  <p className="text-[10px] font-semibold tracking-[2px] uppercase text-neutral-400 mb-3">
                    Teklifi Hazırlayan
                  </p>
                  <p className="text-sm font-bold text-neutral-800">{settings.name}</p>
                  {settings.taxNumber && (
                    <p className="text-xs text-neutral-400 mt-0.5">VKN: {settings.taxNumber}</p>
                  )}
                  <div className="mt-8 pt-3 border-t border-neutral-200">
                    <p className="text-[10px] text-neutral-400">Kaşe / İmza</p>
                  </div>
                </div>
                <div className="border border-neutral-200 rounded-lg p-4">
                  <p className="text-[10px] font-semibold tracking-[2px] uppercase text-neutral-400 mb-3">
                    İşveren Onayı
                  </p>
                  <p className="text-sm font-bold text-neutral-800">{client?.name || "İşveren"}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">&nbsp;</p>
                  <div className="mt-8 pt-3 border-t border-neutral-200">
                    <p className="text-[10px] text-neutral-400">Tarih / İmza</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-neutral-50 border-t border-neutral-200 px-6 py-3 flex justify-between items-center">
            <span className="text-[10px] text-neutral-400">
              {settings.name}
              {settings.email ? ` · ${settings.email}` : ""}
              {settings.website ? ` · ${settings.website}` : ""}
            </span>
            <span className="text-[10px] text-neutral-400">{quoteNo}</span>
          </div>
        </div>
      </div>
    </>
  );
}
