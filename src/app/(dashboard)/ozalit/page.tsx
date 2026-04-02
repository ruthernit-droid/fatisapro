"use client";

import { useState, useEffect } from "react";
import {
  OzalitJob, OzalitServiceType, OzalitSize,
  OZALIT_SERVICE_LABELS, OZALIT_SIZE_LABELS, Person,
} from "@/types";
import {
  getOzalitJobs, addOzalitJob, updateOzalitJob, deleteOzalitJob,
} from "@/lib/firestore/ozalitJobs";
import { getPersons } from "@/lib/firestore/persons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Printer, Plus, Pencil, Trash2, TrendingUp, TrendingDown,
  Clock, CheckCircle2, Search,
} from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

const SERVICE_COLORS: Record<OzalitServiceType, string> = {
  print: "bg-blue-100 text-blue-700 border-blue-200",
  copy: "bg-purple-100 text-purple-700 border-purple-200",
  scan: "bg-green-100 text-green-700 border-green-200",
  binding: "bg-orange-100 text-orange-700 border-orange-200",
  laminate: "bg-pink-100 text-pink-700 border-pink-200",
  other: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

const DEFAULT_FORM = {
  clientId: "",
  clientName: "",
  description: "",
  serviceType: "print" as OzalitServiceType,
  paperSize: "A1" as OzalitSize,
  copies: 1,
  unitPrice: 0,
  date: new Date().toISOString().slice(0, 10),
  notes: "",
  syncToTransactions: true,
};

export default function OzalitPage() {
  const [jobs, setJobs] = useState<OzalitJob[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [search, setSearch] = useState("");
  const [filterPaid, setFilterPaid] = useState<"all" | "paid" | "unpaid">("all");

  async function load() {
    try {
      const [j, p] = await Promise.all([getOzalitJobs(), getPersons()]);
      setJobs(j);
      setPersons(p);
    } catch {
      toast.error("Veriler yuklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalIncome = jobs.filter((j) => j.isPaid).reduce((s, j) => s + j.totalAmount, 0);
  const totalPending = jobs.filter((j) => !j.isPaid).reduce((s, j) => s + j.totalAmount, 0);
  const totalAll = jobs.reduce((s, j) => s + j.totalAmount, 0);

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      j.description.toLowerCase().includes(q) ||
      (j.clientName || "").toLowerCase().includes(q) ||
      (persons.find((p) => p.id === j.clientId)?.name || "").toLowerCase().includes(q);
    const matchPaid =
      filterPaid === "all" ||
      (filterPaid === "paid" && j.isPaid) ||
      (filterPaid === "unpaid" && !j.isPaid);
    return matchSearch && matchPaid;
  });

  function openAdd() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  function openEdit(j: OzalitJob) {
    setEditingId(j.id);
    setForm({
      clientId: j.clientId || "",
      clientName: j.clientName || "",
      description: j.description,
      serviceType: j.serviceType,
      paperSize: j.paperSize,
      copies: j.copies,
      unitPrice: j.unitPrice,
      date: j.date.toISOString().slice(0, 10),
      notes: j.notes || "",
      syncToTransactions: j.syncToTransactions,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.description.trim()) { toast.error("Aciklama zorunludur."); return; }
    if (form.unitPrice <= 0) { toast.error("Birim fiyat sifirdan buyuk olmali."); return; }
    const totalAmount = form.copies * form.unitPrice;
    const payload = {
      clientId: form.clientId || undefined,
      clientName: form.clientName || undefined,
      description: form.description,
      serviceType: form.serviceType,
      paperSize: form.paperSize,
      copies: form.copies,
      unitPrice: form.unitPrice,
      totalAmount,
      isPaid: false,
      date: new Date(form.date),
      notes: form.notes || undefined,
      syncToTransactions: form.syncToTransactions,
    };
    try {
      if (editingId) {
        await updateOzalitJob(editingId, payload);
        toast.success("Guncellendi");
      } else {
        await addOzalitJob(payload);
        toast.success("Ozalit isi eklendi");
      }
      setShowForm(false);
      await load();
    } catch {
      toast.error("Kaydedilemedi");
    }
  }

  async function togglePaid(job: OzalitJob) {
    const newPaid = !job.isPaid;
    const msg = newPaid
      ? `"${job.description}" (${fmt(job.totalAmount)}) tahsil edildi olarak isaretlensin mi?`
      : `"${job.description}" odeme isaretini kaldirmak istiyor musunuz?`;
    if (!confirm(msg)) return;
    await updateOzalitJob(job.id, {
      isPaid: newPaid,
      paidDate: newPaid ? new Date().toISOString().slice(0, 10) : undefined,
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu ozalit isini silmek istiyor musunuz?")) return;
    await deleteOzalitJob(id);
    toast.success("Silindi");
    await load();
  }

  const getPerson = (id?: string) => id ? persons.find((p) => p.id === id) : undefined;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900">
            <Printer className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Ozalit Hizmetleri</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Ozalit baski ve kopya is takibi</p>
          </div>
        </div>
        <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="h-4 w-4" /> Yeni Is Ekle
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Toplam Ciro</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{fmt(totalAll)}</p>
          <p className="text-xs text-neutral-400 mt-0.5">{jobs.length} is</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">Tahsil Edildi</span>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">{fmt(totalIncome)}</p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">{jobs.filter((j) => j.isPaid).length} is odendi</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Bekleyen</span>
          </div>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{fmt(totalPending)}</p>
          <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">{jobs.filter((j) => !j.isPaid).length} is bekliyor</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara..." className="pl-9 h-9"
          />
        </div>
        <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {(["all", "unpaid", "paid"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterPaid(f)}
              className={cn("px-3 py-2 text-xs font-medium transition-colors",
                filterPaid === f
                  ? "bg-indigo-600 text-white"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              )}
            >
              {f === "all" ? "Tamami" : f === "paid" ? "Odendi" : "Bekleyen"}
            </button>
          ))}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30 p-5">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {editingId ? "Is Duzenle" : "Yeni Ozalit Isi"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1 lg:col-span-2">
              <label className="text-xs text-neutral-500">Aciklama *</label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Is aciklamasi..." className="h-8" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Tarih</label>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="h-8" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Musteri (kisi listesi)</label>
              <select
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                className="w-full h-8 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm px-3 text-neutral-900 dark:text-neutral-100"
              >
                <option value="">-- Secin --</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Veya Serbest Musteri Adi</label>
              <Input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                placeholder="Harici musteri adi..." className="h-8" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Hizmet Turu</label>
              <select
                value={form.serviceType}
                onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value as OzalitServiceType }))}
                className="w-full h-8 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm px-3 text-neutral-900 dark:text-neutral-100"
              >
                {(Object.entries(OZALIT_SERVICE_LABELS) as [OzalitServiceType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Kagit Boyu</label>
              <select
                value={form.paperSize}
                onChange={(e) => setForm((f) => ({ ...f, paperSize: e.target.value as OzalitSize }))}
                className="w-full h-8 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm px-3 text-neutral-900 dark:text-neutral-100"
              >
                {(Object.entries(OZALIT_SIZE_LABELS) as [OzalitSize, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Adet</label>
              <Input type="number" min={1} value={form.copies}
                onChange={(e) => setForm((f) => ({ ...f, copies: parseInt(e.target.value) || 1 }))}
                className="h-8" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Birim Fiyat (TL)</label>
              <Input type="number" min={0} step="0.01" value={form.unitPrice || ""}
                onChange={(e) => setForm((f) => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
                className="h-8" />
            </div>
            <div className="space-y-1 lg:col-span-3">
              <label className="text-xs text-neutral-500">Not</label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Isteğe bagli not..." className="h-8" />
            </div>
            <div className="flex items-center gap-2 lg:col-span-3">
              <input
                type="checkbox" id="syncTx" checked={form.syncToTransactions}
                onChange={(e) => setForm((f) => ({ ...f, syncToTransactions: e.target.checked }))}
                className="w-4 h-4 accent-indigo-600"
              />
              <label htmlFor="syncTx" className="text-xs text-neutral-600 dark:text-neutral-400">
                Genel finansal islemlere yansit (gelir olarak kaydet)
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Toplam: {fmt(form.copies * form.unitPrice)}
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {editingId ? "Guncelle" : "Kaydet"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Iptal</Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-neutral-400">
            {search || filterPaid !== "all" ? "Filtrelerle esesen is bulunamadi." : "Henuz ozalit isi eklenmedi."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Tarih</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Musteri</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Aciklama</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Hizmet</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-neutral-500">Boyut / Adet</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500">Tutar</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-neutral-500">Durum</th>
                  <th className="px-4 py-2.5 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((j) => {
                  const client = getPerson(j.clientId);
                  const displayName = client?.name || j.clientName || "—";
                  return (
                    <tr key={j.id} className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">{fmtDate(j.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-neutral-800 dark:text-neutral-200">{displayName}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 max-w-xs truncate">{j.description}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-[10px]", SERVICE_COLORS[j.serviceType])}>
                          {OZALIT_SERVICE_LABELS[j.serviceType]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-neutral-500">
                        {OZALIT_SIZE_LABELS[j.paperSize]} × {j.copies}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {fmt(j.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => togglePaid(j)}>
                          {j.isPaid ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">
                              Odendi
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 font-medium cursor-pointer hover:bg-orange-200 transition-colors">
                              Bekliyor
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(j)}
                            className="p-1 text-neutral-400 hover:text-indigo-600 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(j.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-700">
                  <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {filtered.length} kayit
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {fmt(filtered.reduce((s, j) => s + j.totalAmount, 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
