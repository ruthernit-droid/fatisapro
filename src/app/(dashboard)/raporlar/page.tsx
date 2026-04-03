"use client";

import { useEffect, useState } from "react";
import { getTransactions } from "@/lib/firestore/transactions";
import { getProjects } from "@/lib/firestore/projects";
import { getOzalitJobs } from "@/lib/firestore/ozalitJobs";
import { Transaction, Project, OzalitJob, TRANSACTION_CATEGORY_LABELS } from "@/types";
import { BarChart3, TrendingUp, TrendingDown, FolderOpen, DollarSign, Printer } from "lucide-react";
import toast from "react-hot-toast";

function formatMoney(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";
}

export default function RaporlarPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ozalitJobs, setOzalitJobs] = useState<OzalitJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTransactions(), getProjects(), getOzalitJobs()])
      .then(([t, p, o]) => { setTransactions(t); setProjects(p); setOzalitJobs(o); })
      .catch(() => toast.error("Raporlar yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const ozalitIncome = ozalitJobs.filter((j) => !j.syncToTransactions).reduce((s, j) => s + (j.isPaid ? j.totalAmount : 0), 0);
  const ozalitPending = ozalitJobs.filter((j) => !j.isPaid).reduce((s, j) => s + j.totalAmount, 0);
  const profit = totalIncome + ozalitIncome - totalExpense;

  // Kategoriye göre gider özeti
  const expenseByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  // Kategoriye göre gelir özeti
  const incomeByCategory = transactions
    .filter((t) => t.type === "income")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Raporlar</h1>
          <p className="text-sm text-neutral-500">Genel finansal özet</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Toplam Gelir</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{formatMoney(totalIncome)}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-red-700">Toplam Gider</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{formatMoney(totalExpense)}</p>
            </div>
            <div className={`rounded-xl border p-5 ${profit >= 0 ? "border-indigo-200 bg-indigo-50" : "border-orange-200 bg-orange-50"}`}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className={`h-4 w-4 ${profit >= 0 ? "text-indigo-600" : "text-orange-600"}`} />
                <span className={`text-xs font-medium ${profit >= 0 ? "text-indigo-700" : "text-orange-700"}`}>
                  Net Kâr/Zarar
                </span>
              </div>
              <p className={`text-2xl font-bold ${profit >= 0 ? "text-indigo-700" : "text-orange-700"}`}>
                {formatMoney(profit)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="h-4 w-4 text-neutral-500" />
                <span className="text-xs font-medium text-neutral-600">Toplam Proje</span>
              </div>
              <p className="text-2xl font-bold text-neutral-800">{projects.length}</p>
              <p className="text-xs text-neutral-400 mt-1">
                {projects.filter(p => p.status === "active").length} aktif
              </p>
            </div>
          </div>

          {/* Ozalit KPI */}
          {ozalitJobs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-5 col-span-1 sm:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <Printer className="h-4 w-4 text-teal-600" />
                  <span className="text-xs font-medium text-teal-700">Ozalit Geliri (Tahsil)</span>
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
                <p className="text-2xl font-bold text-neutral-800">{ozalitJobs.length}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  {ozalitJobs.filter(j => j.isPaid).length} tahsil edildi
                </p>
              </div>
            </div>
          )}

          {/* Income by Category */}
          {Object.keys(incomeByCategory).length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-neutral-800 mb-4 flex items-center gap-2">
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
                            {TRANSACTION_CATEGORY_LABELS[cat as keyof typeof TRANSACTION_CATEGORY_LABELS] || cat}
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
              <h2 className="text-sm font-semibold text-neutral-800 mb-4 flex items-center gap-2">
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
                            {TRANSACTION_CATEGORY_LABELS[cat as keyof typeof TRANSACTION_CATEGORY_LABELS] || cat}
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

          {transactions.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-neutral-200 p-12 text-center">
              <BarChart3 className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">
                Raporları görmek için önce işlemler ekleyin.
              </p>
            </div>
          )}

          {/* Project status breakdown */}
          {projects.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-indigo-500" />
                Proje Durumu
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(["active", "completed", "on_hold", "draft", "archived", "cancelled"] as const).map((status) => {
                  const count = projects.filter(p => p.status === status).length;
                  if (count === 0) return null;
                  const labels: Record<string, string> = { active: "Aktif", completed: "Tamamlandı", on_hold: "Beklemede", draft: "Taslak", archived: "Arşiv", cancelled: "İptal" };
                  const colors: Record<string, string> = { active: "bg-green-50 border-green-200 text-green-700", completed: "bg-blue-50 border-blue-200 text-blue-700", on_hold: "bg-yellow-50 border-yellow-200 text-yellow-700", draft: "bg-neutral-50 border-neutral-200 text-neutral-600", archived: "bg-neutral-50 border-neutral-200 text-neutral-500", cancelled: "bg-red-50 border-red-200 text-red-600" };
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

        </div>
      )}
    </div>
  );
}
