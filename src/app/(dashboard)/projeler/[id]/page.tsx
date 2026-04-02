"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Project,
  ProjectServiceItem,
  ProjectPaymentPlan,
  Person,
  PersonCategory,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  SERVICE_ITEM_STATUS_LABELS,
  SERVICE_ITEM_STATUS_COLORS,
} from "@/types";
import { getProject, updateProject } from "@/lib/firestore/projects";
import {
  getServiceItems,
  updateServiceItem,
  deleteServiceItem,
  addServiceItem,
} from "@/lib/firestore/projectServiceItems";
import {
  getPaymentPlans,
  addPaymentPlan,
  updatePaymentPlan,
  deletePaymentPlan,
} from "@/lib/firestore/projectPaymentPlans";
import { getPersons } from "@/lib/firestore/persons";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ServiceItemDialog from "@/components/projects/ServiceItemDialog";
import { cn, formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Archive,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Wallet,
  User,
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [serviceItems, setServiceItems] = useState<ProjectServiceItem[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<ProjectPaymentPlan[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const { categories } = useCategories();
  const [loading, setLoading] = useState(true);

  // Düzenleme durumları
  const [editingItem, setEditingItem] = useState<ProjectServiceItem | null>(null);
  const [showItemDialog, setShowItemDialog] = useState(false);

  // Paket fiyat düzenleme
  const [editingPackagePrice, setEditingPackagePrice] = useState(false);
  const [packagePriceInput, setPackagePriceInput] = useState("");

  // Ödeme planı ekleme formu
  const [addingPayment, setAddingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ title: "", amount: 0, dueDate: "" });

  const loadAll = useCallback(async () => {
    try {
      const [proj, items, plans, prs] = await Promise.all([
        getProject(projectId),
        getServiceItems(projectId),
        getPaymentPlans(projectId),
        getPersons(),
      ]);
      if (!proj) { router.push("/projeler"); return; }
      setProject(proj);
      setServiceItems(items);
      setPaymentPlans(plans);
      setPersons(prs);
    } catch {
      toast.error("Proje yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Finansal hesaplamalar ────────────────────────────────────────────────
  const totalCost = serviceItems.reduce((s, i) => s + (i.cost || 0), 0);
  const packagePrice = project?.contractAmount || 0;
  const estimatedProfit = packagePrice - totalCost;

  const totalReceivedFromClient = paymentPlans
    .filter((p) => p.isPaid)
    .reduce((s, p) => s + p.paidAmount, 0);
  const outstandingFromClient = packagePrice - totalReceivedFromClient;

  const totalPaidToMuellif = serviceItems.reduce((s, item) => {
    const paid = item.paymentInstallments
      .filter((i) => i.isPaid)
      .reduce((ps, i) => ps + i.amount, 0);
    return s + paid;
  }, 0);
  const totalRemainingToMuellif = totalCost - totalPaidToMuellif;

  // ── Yardımcı ────────────────────────────────────────────────────────────
  const getPerson = (id?: string) => id ? persons.find((p) => p.id === id) : undefined;

  // ── Paket Fiyat güncelleme ──────────────────────────────────────────────
  function startEditingPrice() {
    setPackagePriceInput(String(packagePrice || ""));
    setEditingPackagePrice(true);
  }

  async function savePackagePrice() {
    const newPrice = parseFloat(packagePriceInput) || 0;
    await updateProject(projectId, { contractAmount: newPrice });
    setProject((p) => p ? { ...p, contractAmount: newPrice } : p);
    setEditingPackagePrice(false);
    toast.success("Paket fiyat güncellendi");
  }

  // ── Hizmet kalemi CRUD ──────────────────────────────────────────────────
  function openEditItem(item: ProjectServiceItem) {
    setEditingItem(item);
    setShowItemDialog(true);
  }

  async function handleSaveItem(data: Partial<Omit<ProjectServiceItem, "id" | "createdAt" | "updatedAt">>) {
    if (editingItem) {
      await updateServiceItem(editingItem.id, data);
      toast.success("Hizmet kalemi güncellendi");
    }
    await loadAll();
  }

  async function handleDeleteItem(id: string) {
    if (!confirm("Bu hizmet kalemini silmek istediğinizden emin misiniz?")) return;
    await deleteServiceItem(id);
    toast.success("Silindi");
    setServiceItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleAddCustomItem() {
    await addServiceItem({
      projectId,
      serviceName: "Yeni Hizmet",
      cost: 0,
      status: "not_started",
      paymentInstallments: [],
      order: serviceItems.length + 1,
    });
    await loadAll();
  }

  // ── Müşteri ödeme planı CRUD ─────────────────────────────────────────────
  async function handleAddPaymentPlan() {
    if (!paymentForm.title.trim() || paymentForm.amount <= 0) {
      toast.error("Başlık ve tutar zorunludur.");
      return;
    }
    await addPaymentPlan({
      projectId,
      title: paymentForm.title,
      amount: paymentForm.amount,
      dueDate: paymentForm.dueDate || undefined,
      paidAmount: 0,
      isPaid: false,
      order: paymentPlans.length + 1,
    });
    setPaymentForm({ title: "", amount: 0, dueDate: "" });
    setAddingPayment(false);
    toast.success("Ödeme planı eklendi");
    await loadAll();
  }

  async function togglePaymentPaid(plan: ProjectPaymentPlan) {
    const isPaid = !plan.isPaid;
    await updatePaymentPlan(plan.id, {
      isPaid,
      paidAmount: isPaid ? plan.amount : 0,
      paidDate: isPaid ? new Date().toISOString().slice(0, 10) : undefined,
    });
    await loadAll();
  }

  async function handleDeletePayment(id: string) {
    if (!confirm("Bu ödeme planını silmek istiyor musunuz?")) return;
    await deletePaymentPlan(id);
    await loadAll();
  }

  // ── Arşivleme ────────────────────────────────────────────────────────────
  async function handleArchive() {
    const unpaidPlans = paymentPlans.filter((p) => !p.isPaid && p.amount > 0);
    if (unpaidPlans.length > 0) {
      const unpaidTotal = unpaidPlans.reduce((s, p) => s + (p.amount - p.paidAmount), 0);
      toast.error(`Arşivlenemez: ${formatCurrency(unpaidTotal)} tahsil edilmemiş bakiye var.`);
      return;
    }
    if (!confirm("Projeyi arşivlemek istiyor musunuz?")) return;
    await updateProject(projectId, { status: "archived" });
    toast.success("Proje arşivlendi");
    router.push("/projeler");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Üst bar */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/projeler">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">{project.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500 flex-wrap">
              <span>{PROJECT_TYPE_LABELS[project.type]}</span>
              {project.neighborhood && <><span>·</span><span>{project.neighborhood}</span></>}
              {project.parcel && <><span>·</span><span>Ada/Parsel: {project.parcel}</span></>}
              {getPerson(project.clientId) && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <Link href={`/kisiler/${project.clientId}`} className="hover:text-indigo-600">
                      {getPerson(project.clientId)?.name}
                    </Link>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            className={cn("text-xs", {
              "bg-green-100 text-green-700 border-green-200": project.status === "active",
              "bg-neutral-100 text-neutral-600 border-neutral-200": project.status === "archived",
            })}
            variant="outline"
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
          {project.status !== "archived" && (
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="h-3.5 w-3.5" />
              Arşivle
            </Button>
          )}
        </div>
      </div>

      {/* Finansal özet kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Paket Fiyat */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-500" /> Paket Fiyat
          </p>
          {editingPackagePrice ? (
            <div className="flex gap-1 items-center">
              <Input
                autoFocus
                type="number"
                value={packagePriceInput}
                onChange={(e) => setPackagePriceInput(e.target.value)}
                className="h-7 text-sm w-28"
                onKeyDown={(e) => e.key === "Enter" && savePackagePrice()}
              />
              <button onClick={savePackagePrice} className="text-xs text-green-600 font-medium">✓</button>
              <button onClick={() => setEditingPackagePrice(false)} className="text-xs text-neutral-400">✕</button>
            </div>
          ) : (
            <button onClick={startEditingPrice} className="text-xl font-bold text-neutral-900 hover:text-indigo-600 transition-colors text-left">
              {packagePrice > 0 ? formatCurrency(packagePrice) : <span className="text-sm text-neutral-400">Fiyat girin</span>}
            </button>
          )}
        </div>

        {/* Toplam Maliyet */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
            <TrendingDown className="h-3.5 w-3.5 text-orange-500" /> Müellif Maliyeti
          </p>
          <p className="text-xl font-bold text-neutral-900">{formatCurrency(totalCost)}</p>
          {totalRemainingToMuellif > 0 && (
            <p className="text-xs text-orange-500 mt-0.5">{formatCurrency(totalRemainingToMuellif)} ödenmedi</p>
          )}
        </div>

        {/* Tahmini Kar */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500 mb-1">Tahmini Kar</p>
          <p className={cn("text-xl font-bold", estimatedProfit >= 0 ? "text-green-600" : "text-red-600")}>
            {packagePrice > 0 ? formatCurrency(estimatedProfit) : "—"}
          </p>
          {packagePrice > 0 && totalCost > 0 && (
            <p className="text-xs text-neutral-400 mt-0.5">
              %{Math.round((estimatedProfit / packagePrice) * 100)} marj
            </p>
          )}
        </div>

        {/* Müşteri Bakiye */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5 text-blue-500" /> Müşteri Bakiye
          </p>
          <p className={cn("text-xl font-bold", outstandingFromClient > 0 ? "text-red-600" : "text-green-600")}>
            {packagePrice > 0 ? formatCurrency(outstandingFromClient) : "—"}
          </p>
          {outstandingFromClient > 0 && packagePrice > 0 && (
            <p className="text-xs text-neutral-400 mt-0.5">tahsil edilmedi</p>
          )}
        </div>
      </div>

      {/* Hizmet Kalemleri Tablosu */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">Hizmet Kalemleri</h2>
          <Button size="sm" variant="outline" onClick={handleAddCustomItem}>
            <Plus className="h-3.5 w-3.5" /> Satır Ekle
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 w-8">#</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Hizmet</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Müellif</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500">Maliyet</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500">Ödenen</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500">Kalan</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Durum</th>
                <th className="px-4 py-2.5 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {serviceItems.map((item) => {
                const muellif = getPerson(item.muellif);
                const paid = item.paymentInstallments
                  .filter((i) => i.isPaid)
                  .reduce((s, i) => s + i.amount, 0);
                const remaining = item.cost - paid;
                return (
                  <tr key={item.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                    <td className="px-4 py-2.5 text-xs text-neutral-400">{item.order}</td>
                    <td className="px-4 py-2.5 font-medium text-neutral-800">{item.serviceName}</td>
                    <td className="px-4 py-2.5">
                      {muellif ? (
                        <Link href={`/kisiler/${muellif.id}`} className="text-xs text-indigo-600 hover:underline">
                          {muellif.name}
                        </Link>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-medium">
                      {item.cost > 0 ? formatCurrency(item.cost) : <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-green-600">
                      {paid > 0 ? formatCurrency(paid) : <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs">
                      {item.cost > 0 ? (
                        <span className={remaining > 0 ? "text-red-500 font-medium" : "text-green-600"}>
                          {formatCurrency(remaining)}
                        </span>
                      ) : <span className="text-neutral-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", SERVICE_ITEM_STATUS_COLORS[item.status])}>
                        {SERVICE_ITEM_STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEditItem(item)}
                          className="p-1 text-neutral-400 hover:text-indigo-600 transition-colors"
                          title="Düzenle"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-50 border-t border-neutral-200">
                <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-neutral-700">
                  TOPLAM
                </td>
                <td className="px-4 py-3 text-right text-xs font-bold text-neutral-900">
                  {formatCurrency(totalCost)}
                </td>
                <td className="px-4 py-3 text-right text-xs font-bold text-green-600">
                  {formatCurrency(totalPaidToMuellif)}
                </td>
                <td className="px-4 py-3 text-right text-xs font-bold text-red-500">
                  {totalRemainingToMuellif > 0 ? formatCurrency(totalRemainingToMuellif) : "✓"}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Müşteri Ödeme Planı */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">Müşteri Ödeme Takibi</h2>
          <Button size="sm" variant="outline" onClick={() => setAddingPayment(true)}>
            <Plus className="h-3.5 w-3.5" /> Ödeme Planı Ekle
          </Button>
        </div>

        {/* Ekleme formu */}
        {addingPayment && (
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
            <div className="flex gap-2 items-end flex-wrap">
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Başlık</label>
                <Input
                  value={paymentForm.title}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Avans, 1. Ödeme..."
                  className="h-8 text-sm w-36"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Tutar (₺)</label>
                <Input
                  type="number"
                  value={paymentForm.amount || ""}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className="h-8 text-sm w-28"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Vade</label>
                <Input
                  type="date"
                  value={paymentForm.dueDate}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="h-8 text-sm w-36"
                />
              </div>
              <Button size="sm" onClick={handleAddPaymentPlan}>Ekle</Button>
              <Button size="sm" variant="outline" onClick={() => setAddingPayment(false)}>İptal</Button>
            </div>
          </div>
        )}

        {paymentPlans.length === 0 && !addingPayment ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-400">
            Henüz ödeme planı eklenmedi.
          </div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {paymentPlans.map((plan) => (
              <div key={plan.id} className="flex items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={plan.isPaid}
                  onChange={() => togglePaymentPaid(plan)}
                  className="w-4 h-4 accent-green-600"
                />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", plan.isPaid && "line-through text-neutral-400")}>
                    {plan.title}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatCurrency(plan.amount)}
                    {plan.dueDate && ` · Vade: ${new Date(plan.dueDate).toLocaleDateString("tr-TR")}`}
                    {plan.isPaid && plan.paidDate && ` · Ödendi: ${new Date(plan.paidDate).toLocaleDateString("tr-TR")}`}
                  </p>
                </div>
                {plan.isPaid ? (
                  <span className="text-xs text-green-600 font-medium">✓ Ödendi</span>
                ) : (
                  <span className="text-xs text-red-500 font-medium">{formatCurrency(plan.amount - plan.paidAmount)} bekliyor</span>
                )}
                <button
                  onClick={() => handleDeletePayment(plan.id)}
                  className="text-neutral-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {/* Toplam */}
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 text-sm font-medium">
              <span className="text-neutral-700">
                Toplam: {formatCurrency(paymentPlans.reduce((s, p) => s + p.amount, 0))}
              </span>
              <span className="text-green-600">
                Tahsil: {formatCurrency(totalReceivedFromClient)}
              </span>
              <span className={outstandingFromClient > 0 ? "text-red-500" : "text-green-600"}>
                Bakiye: {formatCurrency(outstandingFromClient)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Service Item düzenleme dialog */}
      <ServiceItemDialog
        open={showItemDialog}
        onClose={() => { setShowItemDialog(false); setEditingItem(null); }}
        onSave={handleSaveItem}
        item={editingItem}
        persons={persons}
      />
    </div>
  );
}
