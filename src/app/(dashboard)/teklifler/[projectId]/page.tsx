"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProject, updateProject } from "@/lib/firestore/projects";
import { getServiceItems } from "@/lib/firestore/projectServiceItems";
import { getPersons } from "@/lib/firestore/persons";
import { getCompanySettings, getAppSettings } from "@/lib/firestore/settings";
import { addQuote } from "@/lib/firestore/quotes";
import { Project, ProjectServiceItem, Person, CompanySettings, AppSettings } from "@/types";
import { ArrowLeft, FileText, ExternalLink, Send, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

function genQuoteNo() {
  const y = new Date().getFullYear();
  const n = Math.floor(Math.random() * 900 + 100);
  return `TKL-${y}-${n}`;
}

const TEMPLATES = [
  { id: 1, name: "Dark Luxury",       desc: "Koyu zemin, altın vurgular. Prestijli tasarım.", accent: "from-neutral-900 to-neutral-800",             badge: "bg-yellow-500/20 text-yellow-400",  src: "/quote-templates/template1.html" },
  { id: 2, name: "Classic White",     desc: "Beyaz zemin, mavi vurgular. Kurumsal.",           accent: "from-blue-50 to-white border border-blue-100",     badge: "bg-blue-100 text-blue-700",        src: "/quote-templates/template2.html" },
  { id: 3, name: "Modern Geometric",  desc: "Yeşil/teal vurgular, geometrik öğeler.",          accent: "from-emerald-50 to-white border border-emerald-100", badge: "bg-emerald-100 text-emerald-700",  src: "/quote-templates/template3.html" },
];

export default function QuoteTemplateSelectorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject]     = useState<Project | null>(null);
  const [serviceItems, setServiceItems] = useState<ProjectServiceItem[]>([]);
  const [client, setClient]       = useState<Person | null>(null);
  const [settings, setSettings]   = useState<CompanySettings | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [sent, setSent]           = useState(false);
  const [quoteNo]                 = useState(genQuoteNo);

  const loadData = useCallback(async () => {
    try {
      const [proj, items, persons, cfg, appCfg] = await Promise.all([
        getProject(projectId),
        getServiceItems(projectId),
        getPersons(),
        getCompanySettings(),
        getAppSettings(),
      ]);
      if (!proj) { router.push("/teklifler"); return; }
      setProject(proj);
      setServiceItems(items);
      setClient(persons.find((p) => p.id === proj.clientId) || null);
      setSettings(cfg);
      setAppSettings(appCfg);
    } catch {
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => { loadData(); }, [loadData]);

  function openTemplate(templateId: number) {
    if (!project) return;
    const total = project.contractAmount || serviceItems.reduce((s, i) => s + (i.cost || 0), 0);
    const data = {
      firm:         settings?.name        || "",
      firmAddress:  settings?.address     || "",
      firmPhone:    settings?.phone       || "",
      firmEmail:    settings?.email       || "",
      firmTax:      settings?.taxNumber && settings.taxOffice
                      ? `${settings.taxNumber} / ${settings.taxOffice}`
                      : settings?.taxNumber || "",
      firmIban:     settings?.iban        || "",
      firmBankName: settings?.bankName    || "",
      project:      project.title,
      projectNo:    project.projectNo     || "",
      client:       client?.name          || "",
      clientPhone:  client?.phone         || "",
      clientEmail:  client?.email         || "",
      clientAddress:client?.address       || "",
      clientTax:    client?.taxNumber     || "",
      clientCompany:client?.companyName   || "",
      quote:        quoteNo,
      items:        serviceItems.map((i) => ({
        name: i.serviceName,
        price: appSettings?.showCostInQuotes ? (i.cost || 0) : 0,
      })),
      showCost:     appSettings?.showCostInQuotes ?? false,
      kdvEnabled:   appSettings?.kdvEnabled ?? false,
      kdvRate:      appSettings?.kdvRate ?? 20,
      total,
    };
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    window.open(`/quote-templates/template${templateId}.html?d=${encoded}`, "_blank");
  }

  async function handleMarkSent() {
    if (!project) return;
    setSaving(true);
    try {
      const subtotal = serviceItems.reduce((s, i) => s + (i.cost || 0), 0);
      const grandTotal = project.contractAmount || subtotal;
      await addQuote({
        projectId,
        personId: project.clientId,
        quoteNo,
        title: project.title,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }
  if (!project) return null;

  const subtotal = serviceItems.reduce((s, i) => s + (i.cost || 0), 0);
  const total = project.contractAmount || subtotal;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <div>
        <Link
          href={`/projeler/${projectId}`}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Projeye Dön
        </Link>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Teklif Şablonu Seç</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          <span className="font-medium text-neutral-700">{project.title}</span>
          {client && <> — {client.name}</>}
        </p>
      </div>

      {/* Project data summary */}
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-sm">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-indigo-600" />
          <span className="font-semibold text-indigo-800">Otomatik Doldurulacak Veriler</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-indigo-700">
          {settings?.name && (
            <div><p className="text-[10px] text-indigo-400 uppercase tracking-wide">Firma</p><p className="font-medium text-xs">{settings.name}</p></div>
          )}
          <div><p className="text-[10px] text-indigo-400 uppercase tracking-wide">Proje</p><p className="font-medium text-xs">{project.title}</p></div>
          {client && (
            <div><p className="text-[10px] text-indigo-400 uppercase tracking-wide">Müşteri</p><p className="font-medium text-xs">{client.name}</p></div>
          )}
          <div><p className="text-[10px] text-indigo-400 uppercase tracking-wide">Teklif No</p><p className="font-medium text-xs">{quoteNo}</p></div>
          {total > 0 && (
            <div><p className="text-[10px] text-indigo-400 uppercase tracking-wide">Tutar</p><p className="font-medium text-xs">{total.toLocaleString("tr-TR")} ₺</p></div>
          )}
        </div>
        {serviceItems.length > 0 && (
          <p className="text-xs text-indigo-500 mt-3">
            <span className="font-medium">{serviceItems.length} hizmet kalemi:</span>{" "}
            {serviceItems.map((i) => i.serviceName).join(", ")}
          </p>
        )}
      </div>

      {/* Template cards */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">Teklif Şablonunu Seçin</h2>
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
                <p className="text-sm font-semibold text-neutral-800 mb-1">Şablon {t.id}: {t.name}</p>
                <p className="text-xs text-neutral-500 mb-3">{t.desc}</p>
                <button
                  onClick={() => openTemplate(t.id)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold py-2 hover:bg-indigo-700 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Bu Şablonu Kullan
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-400 mt-3">
          Şablon yeni sekmede açılır ve proje verileriyle otomatik doldurulur. Sağ panelden düzenleyip PDF alabilirsiniz.
        </p>
      </div>

      {/* Mark sent */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-800 mb-1">Teklifi Gönderildi Olarak İşaretle</h2>
        <p className="text-xs text-neutral-500 mb-4">
          PDF&apos;i müşteriye gönderdikten sonra bu butona tıklayın. Teklif Firestore&apos;a kaydedilir ve proje{" "}
          <span className="font-medium text-yellow-700">Beklemede</span> durumuna alınır.
        </p>
        {sent ? (
          <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
            <CheckCircle className="h-4 w-4" />
            Teklif gönderildi — proje beklemede
          </div>
        ) : (
          <button
            onClick={handleMarkSent}
            disabled={saving}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              saving
                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            )}
          >
            <Send className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Teklifi Gönderildi Olarak Kaydet"}
          </button>
        )}
      </div>
    </div>
  );
}


