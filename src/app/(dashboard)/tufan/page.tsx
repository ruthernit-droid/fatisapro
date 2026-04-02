"use client";

import { useState, useEffect } from "react";
import {
  TufanTransaction, TufanTransactionType, TufanTransactionCategory,
  TUFAN_CATEGORY_LABELS, Person,
} from "@/types";
import {
  getTufanTransactions, addTufanTransaction,
  updateTufanTransaction, deleteTufanTransaction,
} from "@/lib/firestore/tufanTransactions";
import { getPersons } from "@/lib/firestore/persons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Wallet, Plus, Pencil, Trash2, TrendingUp, TrendingDown,
  Clock, Search, Calendar, User, AlertCircle,
} from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";
}
function fmtDate(d?: Date) {
  if (!d) return "—";
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}
function isOverdue(d?: Date) {
  if (!d) return false;
  return d < new Date();
}

const CAT_COLORS: Record<TufanTransactionCategory, string> = {
  receivable: "bg-blue-100 text-blue-700 border-blue-200",
  payable: "bg-orange-100 text-orange-700 border-orange-200",
  payment: "bg-red-100 text-red-700 border-red-200",
  collection: "bg-green-100 text-green-700 border-green-200",
  other: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

const DEFAULT_FORM = {
  personId: "",
  personName: "",
  type: "income" as TufanTransactionType,
  category: "receivable" as TufanTransactionCategory,
  amount: 0,
  description: "",
  date: new Date().toISOString().slice(0, 10),
  dueDate: "",
  notes: "",
  isPaid: false,
};

export default function TufanPage() {
  const [transactions, setTransactions] = useState<TufanTransaction[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterPaid, setFilterPaid] = useState<"all" | "paid" | "unpaid">("all");

  async function load() {
    try {
      const [tx, p] = await Promise.all([getTufanTransactions(), getPersons()]);
      setTransactions(tx);
      setPersons(p);
    } catch {
      toast.error("Veriler yuklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalReceivable = transactions
    .filter((t) => t.type === "income" && !t.isPaid)
    .reduce((s, t) => s + t.amount, 0);
  const totalCollected = transactions
    .filter((t) => t.type === "income" && t.isPaid)
    .reduce((s, t) => s + t.amount, 0);
  const totalPayable = transactions
    .filter((t) => t.type === "expense" && !t.isPaid)
    .reduce((s, t) => s + t.amount, 0);
  const totalPaid = transactions
    .filter((t) => t.type === "expense" && t.isPaid)
    .reduce((s, t) => s + t.amount, 0);
  const overdueCount = transactions.filter(
    (t) => !t.isPaid && isOverdue(t.dueDate)
  ).length;

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const pName = persons.find((p) => p.id === t.personId)?.name || "";
    const matchSearch =
      !q ||
      t.description.toLowerCase().includes(q) ||
      (t.personName || "").toLowerCase().includes(q) ||
      pName.toLowerCase().includes(q);
    const matchType = filterType === "all" || t.type === filterType;
    const matchPaid =
      filterPaid === "all" ||
      (filterPaid === "paid" && t.isPaid) ||
      (filterPaid === "unpaid" && !t.isPaid);
    return matchSearch && matchType && matchPaid;
  });

  function openAdd() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  function openEdit(t: TufanTransaction) {
    setEditingId(t.id);
    setForm({
      personId: t.personId || "",
      personName: t.personName || "",
      type: t.type,
      category: t.category,
      amount: t.amount,
      description: t.description,
      date: t.date.toISOString().slice(0, 10),
      dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : "",
      notes: t.notes || "",
      isPaid: t.isPaid,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.description.trim()) { toast.error("Aciklama zorunludur."); return; }
    if (form.amount <= 0) { toast.error("Tutar sifirdan buyuk olmali."); return; }
    const payload = {
      personId: form.personId || undefined,
      personName: form.personName || undefined,
      type: form.type,
      category: form.category,
      amount: form.amount,
      description: form.description,
      date: new Date(form.date),
      dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
      isPaid: form.isPaid,
      paidDate: form.isPaid ? new Date() : undefined,
      notes: form.notes || undefined,
    };
    try {
      if (editingId) {
        await updateTufanTransaction(editingId, payload);
        toast.success("Guncellendi");
      } else {
        await addTufanTransaction(payload);
        toast.success("Kayit eklendi");
      }
      setShowForm(false);
      await load();
    } catch {
      toast.error("Kaydedilemedi");
    }
  }

  async function togglePaid(t: TufanTransaction) {
    const newPaid = !t.isPaid;
    const label = newPaid ? "odendi/tahsil edildi" : "odenmedi";
    if (!confirm(`"${t.description}" (${fmt(t.amount)}) ${label} olarak isaretlensin mi?`)) return;
    await updateTufanTransaction(t.id, {
      isPaid: newPaid,
      paidDate: newPaid ? new Date() : undefined,
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu kaydi silmek istiyor musunuz?")) return;
    await deleteTufanTransaction(id);
    toast.success("Silindi");
    await load();
  }

  const getPerson = (id?: string) => id ? persons.find((p) => p.id === id) : undefined;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ISOLATED INDICATOR */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 flex items-center gap-3">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>Ozel Alan:</strong> Bu bolum yalnizca Tufan'a ait izole bir calisma alanıdır.
          Genel finansal raporlara ve proje verilerine yansimaz. Sadece kisi listesi ortaktir.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900">
            <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Tufan Ozel Isler</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Kisisel alacak-verecek ve is takibi</p>
          </div>
        </div>
        <Button onClick={openAdd} className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="h-4 w-4" /> Kayit Ekle
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Toplam Alacak</span>
          </div>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{fmt(totalReceivable)}</p>
          <p className="text-xs text-blue-500 mt-0.5">tahsil edilmedi</p>
        </div>
        <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">Tahsil Edildi</span>
          </div>
          <p className="text-xl font-bold text-green-700 dark:text-green-300">{fmt(totalCollected)}</p>
        </div>
        <div className="rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Toplam Verecek</span>
          </div>
          <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{fmt(totalPayable)}</p>
          <p className="text-xs text-orange-500 mt-0.5">odenmedi</p>
        </div>
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Vadesi Gecen</span>
          </div>
          <p className="text-xl font-bold text-red-600">{overdueCount}</p>
          <p className="text-xs text-neutral-400 mt-0.5">kayit</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara..." className="pl-9 h-9" />
        </div>
        <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {(["all", "income", "expense"] as const).map((f) => (
            <button key={f} onClick={() => setFilterType(f)}
              className={cn("px-3 py-2 text-xs font-medium transition-colors",
                filterType === f
                  ? "bg-purple-600 text-white"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              )}
            >
              {f === "all" ? "Tamami" : f === "income" ? "Alacak" : "Verecek"}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {(["all", "unpaid", "paid"] as const).map((f) => (
            <button key={f} onClick={() => setFilterPaid(f)}
              className={cn("px-3 py-2 text-xs font-medium transition-colors",
                filterPaid === f
                  ? "bg-purple-600 text-white"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              )}
            >
              {f === "all" ? "Tamami" : f === "paid" ? "Tamamlandi" : "Bekleyen"}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/20 p-5">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {editingId ? "Kaydi Duzenle" : "Yeni Kayit"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1 lg:col-span-2">
              <label className="text-xs text-neutral-500">Aciklama *</label>
              <Input value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Is aciklamasi..." className="h-8" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Tarih</label>
              <Input type="date" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="h-8" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Tur</label>
              <select value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TufanTransactionType }))}
                className="w-full h-8 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm px-3 text-neutral-900 dark:text-neutral-100">
                <option value="income">Alacak / Gelir</option>
                <option value="expense">Verecek / Gider</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Kategori</label>
              <select value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TufanTransactionCategory }))}
                className="w-full h-8 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm px-3 text-neutral-900 dark:text-neutral-100">
                {(Object.entries(TUFAN_CATEGORY_LABELS) as [TufanTransactionCategory, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Tutar (TL) *</label>
              <Input type="number" min={0} step="0.01" value={form.amount || ""}
                onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                className="h-8" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Kisi (kayitli)</label>
              <select value={form.personId}
                onChange={(e) => setForm((f) => ({ ...f, personId: e.target.value }))}
                className="w-full h-8 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm px-3 text-neutral-900 dark:text-neutral-100">
                <option value="">-- Secin --</option>
                {persons.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Veya Serbest Kisi Adi</label>
              <Input value={form.personName}
                onChange={(e) => setForm((f) => ({ ...f, personName: e.target.value }))}
                placeholder="Kisi adi..." className="h-8" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Vade Tarihi</label>
              <Input type="date" value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="h-8" />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="text-xs text-neutral-500">Not</label>
              <Input value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Isteğe bagli not..." className="h-8" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPaidForm" checked={form.isPaid}
                onChange={(e) => setForm((f) => ({ ...f, isPaid: e.target.checked }))}
                className="w-4 h-4 accent-purple-600" />
              <label htmlFor="isPaidForm" className="text-xs text-neutral-600 dark:text-neutral-400">
                Tamamlandi / Odendi
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button size="sm" onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white">
              {editingId ? "Guncelle" : "Kaydet"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Iptal</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-neutral-400">Henuz kayit eklenmedi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Tarih</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Kisi</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Aciklama</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Kategori</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Vade</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500">Tutar</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-neutral-500">Durum</th>
                  <th className="px-4 py-2.5 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const person = getPerson(t.personId);
                  const displayName = person?.name || t.personName || "—";
                  const overdue = !t.isPaid && isOverdue(t.dueDate);
                  return (
                    <tr key={t.id}
                      className={cn(
                        "border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                        overdue && "bg-red-50/50 dark:bg-red-950/20"
                      )}>
                      <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">{fmtDate(t.date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-neutral-800 dark:text-neutral-200">
                          <User className="h-3 w-3 text-neutral-400" />
                          {displayName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 max-w-xs truncate">{t.description}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", CAT_COLORS[t.category])}>
                          {TUFAN_CATEGORY_LABELS[t.category]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn("flex items-center gap-1 text-xs", overdue ? "text-red-600 dark:text-red-400 font-medium" : "text-neutral-500")}>
                          {overdue && <AlertCircle className="h-3 w-3" />}
                          <Calendar className="h-3 w-3" />
                          {fmtDate(t.dueDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn("text-sm font-bold",
                          t.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                          {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => togglePaid(t)}>
                          {t.isPaid ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                              Tamamlandi
                            </span>
                          ) : (
                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity",
                              overdue
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-orange-100 text-orange-700 border-orange-200"
                            )}>
                              {overdue ? "Gecikti" : "Bekliyor"}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(t)}
                            className="p-1 text-neutral-400 hover:text-purple-600 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(t.id)}
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
                  <td className="px-4 py-3 text-right">
                    <div className="text-xs space-y-0.5">
                      <div className="text-green-600 dark:text-green-400 font-medium">
                        +{fmt(filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0))}
                      </div>
                      <div className="text-red-600 dark:text-red-400 font-medium">
                        -{fmt(filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0))}
                      </div>
                    </div>
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
