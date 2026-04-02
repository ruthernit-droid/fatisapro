"use client";

import { useState, useEffect } from "react";
import { Transaction, TransactionType, TRANSACTION_CATEGORY_LABELS } from "@/types";
import { getTransactions } from "@/lib/firestore/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, Search, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

function formatMoney(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺";
}

export default function IslemlerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");

  useEffect(() => {
    getTransactions()
      .then(setTransactions)
      .catch(() => toast.error("İşlemler yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = transactions.filter((t) => {
    const matchSearch =
      !search.trim() ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.invoiceNo || "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || t.type === filterType;
    return matchSearch && matchType;
  });

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const profit = totalIncome - totalExpense;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">İşlemler</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Gelir ve gider kayıtları</p>
        </div>
        <Button><Plus className="h-4 w-4" />İşlem Ekle</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Toplam Gelir</span>
          </div>
          <p className="text-xl font-bold text-green-700">{formatMoney(totalIncome)}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-red-700">Toplam Gider</span>
          </div>
          <p className="text-xl font-bold text-red-700">{formatMoney(totalExpense)}</p>
        </div>
        <div className={cn(
          "rounded-xl border p-4",
          profit >= 0 ? "border-indigo-200 bg-indigo-50" : "border-orange-200 bg-orange-50"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className={cn("h-4 w-4", profit >= 0 ? "text-indigo-600" : "text-orange-600")} />
            <span className={cn("text-xs font-medium", profit >= 0 ? "text-indigo-700" : "text-orange-700")}>
              Net Kâr/Zarar
            </span>
          </div>
          <p className={cn("text-xl font-bold", profit >= 0 ? "text-indigo-700" : "text-orange-700")}>
            {formatMoney(profit)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "income", "expense"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
              filterType === t
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
            )}
          >
            {t === "all" ? "Tümü" : t === "income" ? "Gelirler" : "Giderler"}
          </button>
        ))}
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İşlem ara..." className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
            <Wallet className="h-7 w-7 text-neutral-400" />
          </div>
          <p className="text-base font-medium text-neutral-700">
            {transactions.length === 0 ? "Henüz işlem eklenmedi" : "İşlem bulunamadı"}
          </p>
          {transactions.length === 0 && (
            <Button className="mt-4"><Plus className="h-4 w-4" />İlk İşlemi Ekle</Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="flex items-center gap-4 rounded-xl border bg-white px-4 py-3 shadow-sm hover:shadow-md transition-all">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full shrink-0",
                t.type === "income" ? "bg-green-100" : "bg-red-100"
              )}>
                {t.type === "income"
                  ? <TrendingUp className="h-4 w-4 text-green-600" />
                  : <TrendingDown className="h-4 w-4 text-red-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 truncate">{t.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    {TRANSACTION_CATEGORY_LABELS[t.category]}
                  </Badge>
                  <span className="text-[10px] text-neutral-400">
                    {new Date(t.date).toLocaleDateString("tr-TR")}
                  </span>
                  {!t.isPaid && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-orange-50 text-orange-600 border-orange-200">
                      Bekliyor
                    </Badge>
                  )}
                </div>
              </div>
              <p className={cn(
                "text-sm font-semibold shrink-0",
                t.type === "income" ? "text-green-600" : "text-red-600"
              )}>
                {t.type === "income" ? "+" : "-"}{formatMoney(t.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
