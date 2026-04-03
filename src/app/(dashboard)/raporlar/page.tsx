"use client";

import { useEffect, useState, useMemo } from "react";
import { getTransactions } from "@/lib/firestore/transactions";
import { getProjects } from "@/lib/firestore/projects";
import { getOzalitJobs } from "@/lib/firestore/ozalitJobs";
import { getAllPaymentPlans } from "@/lib/firestore/projectPaymentPlans";
import { getAllServiceItems } from "@/lib/firestore/projectServiceItems";
import { getAllExpenses } from "@/lib/firestore/projectExpenses";
import {
  Transaction,
  Project,
  OzalitJob,
  ProjectPaymentPlan,
  ProjectServiceItem,
  ProjectExpense,
  TRANSACTION_CATEGORY_LABELS,
} from "@/types";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  FolderOpen,
  DollarSign,
  Printer,
  Building2,
  Calendar,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

function formatMoney(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";
}

function toDateStr(d: Date | string | undefined | null): string | null {
  if (!d) return null;
  if (typeof d === "string") return d.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function inRange(dateVal: Date | string | undefined | null, from: string, to: string): boolean {
  if (!from && !to) return true;
  const d = toDateStr(dateVal);
  if (!d) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export default function RaporlarPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ozalitJobs, setOzalitJobs] = useState<OzalitJob[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<ProjectPaymentPlan[]>([]);
  const [serviceItems, setServiceItems] = useState<ProjectServiceItem[]>([]);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    Promise.all([
      getTransactions(),
      getProjects(),
      getOzalitJobs(),
      getAllPaymentPlans(),
      getAllServiceItems(),
      getAllExpenses(),
    ])
      .then(([t, p, o, pp, si, ex]) => {
        setTransactions(t);
        setProjects(p);
        setOzalitJobs(o);
        setPaymentPlans(pp);
        setServiceItems(si);
        setExpenses(ex);
      })
      .catch(() => toast.error("Raporlar yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  const filteredTransactions = useMemo(
    () => transactions.filter((t) => inRange(t.date, dateFrom, dateTo)),
    [transactions, dateFrom, dateTo]
  );

  const filteredOzalitJobs = useMemo(
    () => ozalitJobs.filter((j) => inRange(j.createdAt, dateFrom, dateTo)),
    [ozalitJobs, dateFrom, dateTo]
  );

  // Transaction KPIs
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const ozalitIncome = filteredOzalitJobs
    .filter((j) => !j.syncToTransactions && j.isPaid)
    .reduce((s, j) => s + j.totalAmount, 0);
  const ozalitPending = filteredOzalitJobs
    .filter((j) => !j.isPaid)
    .reduce((s, j) => s + j.totalAmount, 0);

  // Project financials (date-filtered)
  const projGelir = useMemo(
    () =>
      paymentPlans
        .filter((p) => p.isPaid && inRange(p.paidDate, dateFrom, dateTo))
        .reduce((s, p) => s + p.paidAmount, 0),
    [paymentPlans, dateFrom, dateTo]
  );
  const muEllifMaliyet = useMemo(
    () =>
      serviceItems
        .flatMap((si) => si.paymentInstallments)
        .filter((inst) => inst.isPaid && inRange(inst.paidDate, dateFrom, dateTo))
        .reduce((s, inst) => s + inst.amount, 0),
    [serviceItems, dateFrom, dateTo]
  );
  const ekHarcama = useMemo(
    () =>
      expenses
        .filter((e) => e.isPaid && inRange(e.paidDate, dateFrom, dateTo))
        .reduce((s, e) => s + e.cost, 0),
    [expenses, dateFrom, dateTo]
  );
  const projKar = projGelir - muEllifMaliyet - ekHarcama;
  const netProfit = totalIncome + ozalitIncome + projGelir - totalExpense - muEllifMaliyet - ekHarcama;

  // Category breakdowns
  const expenseByCategory = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
  const incomeByCategory = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const hasFilter = !!(dateFrom || dateTo);
  const hasProjectData = paymentPlans.length > 0 || serviceItems.length > 0 || expenses.length > 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Raporlar</h1>
          <p className="text-sm text-neutral-500">Genel finansal özet</p>
        </div>
      </div>

      {/* Date range filter */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
        <Calendar className="h-4 w-4 text-neutral-400 shrink-0" />
        <span className="text-sm font-medium text-neutral-600">Tarih Aralığı:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-sm text-neutral-400">â€”</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {hasFilter && (
          <>
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-200"
            >
              <X className="h-3.5 w-3.5" />
              Temizle
            </button>
            <span className="ml-auto rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-600">
              Filtrelenmiş görünüm
            </span>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">İşlem Gelirleri</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{formatMoney(totalIncome)}</p>
              <p className="text-xs text-green-600 mt-1">Finansal işlemler</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-red-700">İşlem Giderleri</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{formatMoney(totalExpense)}</p>
              <p className="text-xs text-red-600 mt-1">Finansal işlemler</p>
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-teal-600" />
                <span className="text-xs font-medium text-teal-700">Proje Gelirleri</span>
              </div>
              <p className="text-2xl font-bold text-teal-700">{formatMoney(projGelir)}</p>
              <p className="text-xs text-teal-600 mt-1">Tahsil edilen</p>
            </div>
            <div
              className={`rounded-xl border p-5 ${
                netProfit >= 0
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-orange-200 bg-orange-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign
                  className={`h-4 w-4 ${netProfit >= 0 ? "text-indigo-600" : "text-orange-600"}`}
                />
                <span
                  className={`text-xs font-medium ${
                    netProfit >= 0 ? "text-indigo-700" : "text-orange-700"
                  }`}
                >
                  Net Kâr/Zarar
                </span>
              </div>
              <p
                className={`text-2xl font-bold ${
                  netProfit >= 0 ? "text-indigo-700" : "text-orange-700"
                }`}
              >
                {formatMoney(netProfit)}
              </p>
              <p
                className={`text-xs mt-1 ${
                  netProfit >= 0 ? "text-indigo-600" : "text-orange-600"
                }`}
              >
                Tüm kaynaklar
              </p>
            </div>
          </div>

          {/* Project financials breakdown */}
          {hasProjectData && (
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-800">
                <Building2 className="h-4 w-4 text-teal-500" />
                Proje Bazlı Finansal Özet
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg border border-teal-100 bg-teal-50 p-3">
                  <p className="text-xs font-medium text-teal-700 mb-1">Proje Gelirleri</p>
                  <p className="text-lg font-bold text-teal-700">{formatMoney(projGelir)}</p>
                  <p className="text-xs text-teal-500 mt-0.5">Tahsil edilen</p>
                </div>
                <div className="rounded-lg border border-orange-100 bg-orange-50 p-3">
                  <p className="text-xs font-medium text-orange-700 mb-1">Müellif Maliyeti</p>
                  <p className="text-lg font-bold text-orange-700">{formatMoney(muEllifMaliyet)}</p>
                  <p className="text-xs text-orange-500 mt-0.5">Ödenen taksitler</p>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                  <p className="text-xs font-medium text-red-700 mb-1">Ek Harcamalar</p>
                  <p className="text-lg font-bold text-red-700">{formatMoney(ekHarcama)}</p>
                  <p className="text-xs text-red-500 mt-0.5">Ödenen masraflar</p>
                </div>
                <div
                  className={`rounded-lg border p-3 ${
                    projKar >= 0
                      ? "border-green-100 bg-green-50"
                      : "border-red-100 bg-red-50"
                  }`}
                >
                  <p
                    className={`text-xs font-medium mb-1 ${
                      projKar >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    Net Proje Kârı
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      projKar >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {formatMoney(projKar)}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      projKar >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    Gelir − maliyet
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ozalit */}
          {ozalitJobs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Printer className="h-4 w-4 text-teal-600" />
                  <span className="text-xs font-medium text-teal-700">Ozalit (Tahsil)</span>
                </div>
                <p className="text-2xl font-bold text-teal-700">{formatMoney(ozalitIncome)}</p>
              </div>
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Printer className="h-4 w-4 text-orange-600" />
                  <span className="text-xs font-medium text-orange-700">Ozalit Bekleyen</span>
                </div>
                <p className="text-2xl font-bold text-orange-700">{formatMoney(ozalitPending)}</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Printer className="h-4 w-4 text-neutral-500" />
                  <span className="text-xs font-medium text-neutral-600">Ozalit İş Sayısı</span>
                </div>
                <p className="text-2xl font-bold text-neutral-800">{filteredOzalitJobs.length}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  {filteredOzalitJobs.filter((j) => j.isPaid).length} tahsil edildi
                </p>
              </div>
            </div>
          )}

          {/* Income by Category */}
          {Object.keys(incomeByCategory).length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-800">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Gelir Kategorileri
              </h2>
              <div className="space-y-2">
                {Object.entries(incomeByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amount]) => {
                    const pct = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-600">
                            {TRANSACTION_CATEGORY_LABELS[
                              cat as keyof typeof TRANSACTION_CATEGORY_LABELS
                            ] || cat}
                          </span>
                          <span className="font-medium text-neutral-800">{formatMoney(amount)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Expense by Category */}
          {Object.keys(expenseByCategory).length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-800">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Gider Kategorileri
              </h2>
              <div className="space-y-2">
                {Object.entries(expenseByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amount]) => {
                    const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-neutral-600">
                            {TRANSACTION_CATEGORY_LABELS[
                              cat as keyof typeof TRANSACTION_CATEGORY_LABELS
                            ] || cat}
                          </span>
                          <span className="font-medium text-neutral-800">{formatMoney(amount)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-red-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Project status */}
          {projects.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-800">
                <FolderOpen className="h-4 w-4 text-indigo-500" />
                Proje Durumu
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(
                  ["active", "completed", "on_hold", "draft", "archived", "cancelled"] as const
                ).map((status) => {
                  const count = projects.filter((p) => p.status === status).length;
                  if (count === 0) return null;
                  const labels: Record<string, string> = {
                    active: "Aktif",
                    completed: "Tamamlandı",
                    on_hold: "Beklemede",
                    draft: "Taslak",
                    archived: "Arşiv",
                    cancelled: "İptal",
                  };
                  const colors: Record<string, string> = {
                    active: "bg-green-50 border-green-200 text-green-700",
                    completed: "bg-blue-50 border-blue-200 text-blue-700",
                    on_hold: "bg-yellow-50 border-yellow-200 text-yellow-700",
                    draft: "bg-neutral-50 border-neutral-200 text-neutral-600",
                    archived: "bg-neutral-50 border-neutral-200 text-neutral-500",
                    cancelled: "bg-red-50 border-red-200 text-red-600",
                  };
                  return (
                    <div key={status} className={`rounded-lg border p-3 ${colors[status]}`}>
                      <p className="text-lg font-bold">{count}</p>
                      <p className="text-xs mt-0.5">{labels[status]}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {transactions.length === 0 && !hasProjectData && (
            <div className="rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
              <BarChart3 className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">Raporları görmek için önce işlemler ekleyin.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
