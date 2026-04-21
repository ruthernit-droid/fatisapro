"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Project,
  ProjectServiceItem,
  ProjectPaymentPlan,
  ProjectExpense,
  Person,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  ProjectType,
  SERVICE_ITEM_STATUS_LABELS,
  SERVICE_ITEM_STATUS_COLORS,
} from "@/types";
import { getProject, updateProject, deleteProject } from "@/lib/firestore/projects";
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
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/firestore/projectExpenses";
import { getPersons } from "@/lib/firestore/persons";
import { useCategories } from "@/hooks/useCategories";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { useProjectTypes } from "@/hooks/useProjectTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ServiceItemDialog from "@/components/projects/ServiceItemDialog";
import { cn, formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  ArrowLeft, Pencil, Trash2, Plus, Archive,
  TrendingUp, TrendingDown, Wallet, User,
  Receipt, CheckCircle, XCircle, Send, Flag,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STATUS_BADGE: Record<string, string> = {
  draft:     "bg-neutral-100 text-neutral-600 border-neutral-200",
  active:    "bg-green-100 text-green-700 border-green-200",
  on_hold:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  archived:  "bg-neutral-100 text-neutral-500 border-neutral-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
};

interface SortableRowProps {
  item: ProjectServiceItem;
  index: number;
  onEdit: (item: ProjectServiceItem) => void;
  onDelete: (id: string) => void;
  getPerson: (id?: string) => Person | undefined;
}

function SortableRow({ item, index, onEdit, onDelete, getPerson }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const muellif = getPerson(item.muellif);
  const paid = item.paymentInstallments.filter((i) => i.isPaid).reduce((s, i) => s + i.amount, 0);
  const remaining = item.cost - paid;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b border-neutral-50 hover:bg-neutral-50/50",
        isDragging && "opacity-50 bg-neutral-100"
      )}
    >
      <td className="px-4 py-2.5 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600"
            title="Sürükle"
          >
            ⋮⋮
          </button>
          {item.order}
        </div>
      </td>
      <td className="px-4 py-2.5 font-medium text-neutral-800">{item.serviceName}</td>
      <td className="px-4 py-2.5">{muellif ? <Link href={`/kisiler/${muellif.id}`} className="text-xs text-indigo-600 hover:underline">{muellif.name}</Link> : <span className="text-xs text-neutral-400">—</span>}</td>
      <td className="px-4 py-2.5 text-right text-xs font-medium">{item.cost > 0 ? formatCurrency(item.cost) : <span className="text-neutral-300">—</span>}</td>
      <td className="px-4 py-2.5 text-right text-xs text-green-600">{paid > 0 ? formatCurrency(paid) : <span className="text-neutral-300">—</span>}</td>
      <td className="px-4 py-2.5 text-right text-xs">{item.cost > 0 ? <span className={remaining > 0 ? "text-red-500 font-medium" : "text-green-600"}>{formatCurrency(remaining)}</span> : <span className="text-neutral-300">—</span>}</td>
      <td className="px-4 py-2.5"><span className={cn("text-[10px] px-2 py-0.5 rounded-full border", SERVICE_ITEM_STATUS_COLORS[item.status])}>{SERVICE_ITEM_STATUS_LABELS[item.status]}</span></td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => onEdit(item)} className="p-1 text-neutral-400 hover:text-indigo-600 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={() => onDelete(item.id)} className="p-1 text-neutral-400 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </td>
    </tr>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [project, setProject] = useState<Project | null>(null);
  const [serviceItems, setServiceItems] = useState<ProjectServiceItem[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<ProjectPaymentPlan[]>([]);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const { categories } = useCategories();
  const { serviceCategories } = useServiceCategories();
  const { projectTypes } = useProjectTypes();
  const [loading, setLoading] = useState(true);

  function resolveProjectType(type: string): string {
    const pt = projectTypes.find((t) => t.id === type || t.name === type);
    return pt?.name || PROJECT_TYPE_LABELS[type as ProjectType] || type;
  }

  const [editingItem, setEditingItem] = useState<ProjectServiceItem | null>(null);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingPackagePrice, setEditingPackagePrice] = useState(false);
  const [packagePriceInput, setPackagePriceInput] = useState("");
  const [addingPayment, setAddingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ title: "", amount: 0, dueDate: "" });
  const [addingExpense, setAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ProjectExpense | null>(null);
  const [expenseForm, setExpenseForm] = useState({ description: "", cost: 0, chargeToClient: 0, notes: "" });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = serviceItems.findIndex((item) => item.id === active.id);
      const newIndex = serviceItems.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(serviceItems, oldIndex, newIndex);
      // Update order numbers
      const updatedItems = newItems.map((item, index) => ({ ...item, order: index + 1 }));
      setServiceItems(updatedItems);
      // Save to database
      updatedItems.forEach(async (item) => {
        try {
          await updateServiceItem(item.id, { order: item.order });
        } catch (e) {
          console.error("Order update failed", e);
        }
      });
    }
  }

  const loadAll = useCallback(async () => {
    try {
      const [proj, items, plans, exps, prs] = await Promise.all([
        getProject(projectId),
        getServiceItems(projectId),
        getPaymentPlans(projectId),
        getExpenses(projectId),
        getPersons(),
      ]);
      if (!proj) { router.push("/projeler"); return; }
      setProject(proj);
      setServiceItems(items);
      setPaymentPlans(plans);
      setExpenses(exps);
      setPersons(prs);
    } catch {
      toast.error("Proje yuklenemedi");
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const totalCost = serviceItems.reduce((s, i) => s + (i.cost || 0), 0);
  const packagePrice = project?.contractAmount || 0;
  const totalPaidToMuellif = serviceItems.reduce((s, item) =>
    s + item.paymentInstallments.filter((i) => i.isPaid).reduce((ps, i) => ps + i.amount, 0), 0);
  const totalRemainingToMuellif = totalCost - totalPaidToMuellif;
  const totalReceivedFromClient = paymentPlans.filter((p) => p.isPaid).reduce((s, p) => s + p.paidAmount, 0);
  const totalExpenseCost = expenses.reduce((s, e) => s + e.cost, 0);
  const totalExpenseChargeable = expenses.reduce((s, e) => s + e.chargeToClient, 0);
  const totalExpensePaidByClient = expenses.filter((e) => e.isPaid).reduce((s, e) => s + e.chargeToClient, 0);
  const expenseClientBalance = totalExpenseChargeable - totalExpensePaidByClient;
  const clientDebt = (packagePrice > 0 ? packagePrice - totalReceivedFromClient : 0) + expenseClientBalance;
  const estimatedProfit = packagePrice - totalCost - totalExpenseCost;

  const getPerson = (id?: string) => id ? persons.find((p) => p.id === id) : undefined;

  function startEditingPrice() { setPackagePriceInput(String(packagePrice || "")); setEditingPackagePrice(true); }
  async function savePackagePrice() {
    const n = parseFloat(packagePriceInput) || 0;
    await updateProject(projectId, { contractAmount: n });
    setProject((p) => p ? { ...p, contractAmount: n } : p);
    setEditingPackagePrice(false);
    toast.success("Paket fiyat guncellendi");
  }
  function openEditItem(item: ProjectServiceItem) { setEditingItem(item); setShowItemDialog(true); }
  async function handleSaveItem(data: Partial<Omit<ProjectServiceItem, "id" | "createdAt" | "updatedAt">>) {
    try {
      if (!editingItem) { toast.error("Hizmet kalemi seçilmedi"); return; }
      await updateServiceItem(editingItem.id, data);
      toast.success("Hizmet kalemi guncellendi");
      await loadAll();
    } catch (e) {
      console.error(e);
      toast.error("Hizmet kalemi kaydedilemedi. Lütfen tekrar deneyin.");
    }
  }
  async function handleDeleteItem(id: string) {
    if (!confirm("Bu hizmet kalemini silmek istediginizden emin misiniz?")) return;
    await deleteServiceItem(id); toast.success("Silindi");
    setServiceItems((prev) => prev.filter((i) => i.id !== id));
  }
  async function handleAddCustomItem() {
    await addServiceItem({ projectId, serviceName: "Yeni Hizmet", cost: 0, status: "not_started", paymentInstallments: [], order: serviceItems.length + 1 });
    await loadAll();
  }
  async function handleAddPaymentPlan() {
    try {
      if (!paymentForm.title.trim() || paymentForm.amount <= 0) { toast.error("Baslik ve tutar zorunludur."); return; }
      await addPaymentPlan({ projectId, title: paymentForm.title, amount: paymentForm.amount, dueDate: paymentForm.dueDate || undefined, paidAmount: 0, isPaid: false, order: paymentPlans.length + 1 });
      setPaymentForm({ title: "", amount: 0, dueDate: "" }); setAddingPayment(false);
      toast.success("Odeme plani eklendi"); await loadAll();
    } catch (e) {
      console.error(e);
      toast.error("Ödeme planı eklenemedi. Lütfen tekrar deneyin.");
    }
  }
  async function togglePaymentPaid(plan: ProjectPaymentPlan) {
    const newPaid = !plan.isPaid;
    const msg = newPaid ? '"' + plan.title + '" (' + formatCurrency(plan.amount) + ') odemesini alindi olarak isaretlemek istiyor musunuz?' : '"' + plan.title + '" odemesinin isaretini kaldirmak istiyor musunuz?';
    if (!confirm(msg)) return;
    await updatePaymentPlan(plan.id, { isPaid: newPaid, paidAmount: newPaid ? plan.amount : 0, paidDate: newPaid ? new Date().toISOString().slice(0, 10) : undefined });
    await loadAll();
  }
  async function handleDeletePayment(id: string) {
    if (!confirm("Bu odeme planini silmek istiyor musunuz?")) return;
    await deletePaymentPlan(id); await loadAll();
  }
  function openAddExpense() { setEditingExpense(null); setExpenseForm({ description: "", cost: 0, chargeToClient: 0, notes: "" }); setAddingExpense(true); }
  function openEditExpense(exp: ProjectExpense) {
    setEditingExpense(exp);
    setExpenseForm({ description: exp.description, cost: exp.cost, chargeToClient: exp.chargeToClient, notes: exp.notes || "" });
    setAddingExpense(true);
  }
  async function handleSaveExpense() {
    try {
      if (!expenseForm.description.trim()) { toast.error("Aciklama zorunludur."); return; }
      if (editingExpense) {
        await updateExpense(editingExpense.id, { description: expenseForm.description, cost: expenseForm.cost, chargeToClient: expenseForm.chargeToClient, notes: expenseForm.notes || undefined });
        toast.success("Harcama guncellendi");
      } else {
        await addExpense({ projectId, description: expenseForm.description, cost: expenseForm.cost, chargeToClient: expenseForm.chargeToClient, isPaid: false, notes: expenseForm.notes || undefined });
        toast.success("Harcama eklendi");
      }
      setAddingExpense(false); setEditingExpense(null); await loadAll();
    } catch (e) {
      console.error(e);
      toast.error("Harcama kaydedilemedi. Lütfen tekrar deneyin.");
    }
  }
  async function toggleExpensePaid(exp: ProjectExpense) {
    const newPaid = !exp.isPaid;
    const msg = newPaid ? '"' + exp.description + '" (' + formatCurrency(exp.chargeToClient) + ') isverenin odedigi olarak isaretlemek istiyor musunuz?' : '"' + exp.description + '" odeme isaretini kaldirmak istiyor musunuz?';
    if (!confirm(msg)) return;
    await updateExpense(exp.id, { isPaid: newPaid, paidDate: newPaid ? new Date().toISOString().slice(0, 10) : undefined });
    await loadAll();
  }
  async function handleDeleteExpense(id: string) {
    if (!confirm("Bu harcamayi silmek istiyor musunuz?")) return;
    await deleteExpense(id); await loadAll();
  }
  function handleSendQuote() {
    router.push(`/teklifler/${projectId}`);
  }
  async function handleAcceptQuote() {
    if (!confirm("Teklif kabul edildi mi? Proje Aktif durumuna alinacak.")) return;
    await updateProject(projectId, { status: "active" });
    setProject((p) => p ? { ...p, status: "active" } : p);
    toast.success("Teklif kabul edildi - proje aktif");
  }
  async function handleRejectQuote() {
    if (!confirm("Teklif reddedildi mi? Proje iptal durumuna alinacak.")) return;
    await updateProject(projectId, { status: "cancelled" });
    setProject((p) => p ? { ...p, status: "cancelled" } : p);
    toast.success("Teklif reddedildi");
  }
  async function handleComplete() {
    if (!confirm("Proje tamamlandi olarak isaretlensin mi? Bu islem geri alinabilir.")) return;
    await updateProject(projectId, { status: "completed" });
    setProject((p) => p ? { ...p, status: "completed" } : p);
    toast.success("Proje tamamlandi");
  }
  async function handleArchive() {
    const unpaid = paymentPlans.filter((p) => !p.isPaid && p.amount > 0);
    if (unpaid.length > 0) { toast.error("Arsivlenemez: " + formatCurrency(unpaid.reduce((s, p) => s + (p.amount - p.paidAmount), 0)) + " tahsil edilmemis bakiye var."); return; }
    if (!confirm("Projeyi arsivlemek istiyor musunuz?")) return;
    await updateProject(projectId, { status: "archived" });
    toast.success("Proje arsivlendi"); router.push("/projeler");
  }
  async function handleDeleteProject() {
    if (!confirm("Bu projeyi kalici olarak silmek istiyor musunuz? Bu islem geri alinamaz.")) return;
    if (!confirm("Emin misiniz? Proje ve tum verileri silinecek.")) return;
    await deleteProject(projectId);
    toast.success("Proje silindi"); router.push("/projeler");
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>;
  if (!project) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Ust bar */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/projeler"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">{project.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500 flex-wrap">
              <span>{resolveProjectType(project.type)}</span>
              {project.neighborhood && <><span>·</span><span>{project.neighborhood}</span></>}
              {project.parcel && <><span>·</span><span>Ada/Parsel: {project.parcel}</span></>}
              {getPerson(project.clientId) && (
                <><span>·</span>
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <Link href={`/kisiler/${project.clientId}`} className="hover:text-indigo-600">{getPerson(project.clientId)?.name}</Link>
                </span></>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <Badge className={cn("text-xs", STATUS_BADGE[project.status] || "")} variant="outline">{PROJECT_STATUS_LABELS[project.status]}</Badge>
          {project.status === "draft" && <Button size="sm" onClick={handleSendQuote} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Send className="h-3.5 w-3.5 mr-1" />Teklif Gonder</Button>}
          {project.status === "on_hold" && <>
            <Button size="sm" onClick={handleAcceptQuote} className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="h-3.5 w-3.5 mr-1" />Kabul Edildi</Button>
            <Button size="sm" variant="outline" onClick={handleRejectQuote} className="border-red-200 text-red-600 hover:bg-red-50"><XCircle className="h-3.5 w-3.5 mr-1" />Reddedildi</Button>
          </>}
          {project.status === "active" && <Button size="sm" onClick={handleComplete} className="bg-blue-600 hover:bg-blue-700 text-white"><Flag className="h-3.5 w-3.5 mr-1" />Tamamla</Button>}
          {(project.status === "active" || project.status === "completed") && <Button variant="outline" size="sm" onClick={handleArchive}><Archive className="h-3.5 w-3.5 mr-1" />Arsivle</Button>}
          {project.status === "cancelled" && <Button variant="outline" size="sm" onClick={handleDeleteProject} className="border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 mr-1" />Projeyi Sil</Button>}
        </div>
      </div>

      {project.status === "draft" && <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">Bu proje taslak asamasindadir. <strong>Teklif Gonder</strong> butonuna tiklayarak teklif belgesi hazirlayin, PDF alin ve gonderin.</div>}
      {project.status === "on_hold" && <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">Teklif gonderildi, isverenden yanit bekleniyor. <strong>Kabul Edildi</strong> veya <strong>Reddedildi</strong> butonlarini kullanin.</div>}
      {project.status === "cancelled" && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">Bu teklif reddedildi. Proje istatistiklere yansimiyor. Isterseniz projeyi kalici olarak silebilirsiniz.</div>}
      {project.status === "completed" && <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">Bu proje tamamlandi. Odeme planini gozden gecirin ve tum odemeler alindiysa projeyi arsivleyebilirsiniz.</div>}

      {/* Finansal ozet */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-indigo-500" /> Paket Fiyat</p>
          {editingPackagePrice ? (
            <div className="flex gap-1 items-center">
              <Input autoFocus type="number" value={packagePriceInput} onChange={(e) => setPackagePriceInput(e.target.value)} className="h-7 text-sm w-28" onKeyDown={(e) => e.key === "Enter" && savePackagePrice()} />
              <button onClick={savePackagePrice} className="text-xs text-green-600 font-medium">OK</button>
              <button onClick={() => setEditingPackagePrice(false)} className="text-xs text-neutral-400">X</button>
            </div>
          ) : (
            <button onClick={startEditingPrice} className="text-xl font-bold text-neutral-900 hover:text-indigo-600 transition-colors text-left">
              {packagePrice > 0 ? formatCurrency(packagePrice) : <span className="text-sm text-neutral-400">Fiyat girin</span>}
            </button>
          )}
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5 text-orange-500" /> Muellif Maliyeti</p>
          <p className="text-xl font-bold text-neutral-900">{formatCurrency(totalCost)}</p>
          {totalRemainingToMuellif > 0 && <p className="text-xs text-orange-500 mt-0.5">{formatCurrency(totalRemainingToMuellif)} odenmedi</p>}
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500 mb-1">Tahmini Kar</p>
          <p className={cn("text-xl font-bold", estimatedProfit >= 0 ? "text-green-600" : "text-red-600")}>{packagePrice > 0 ? formatCurrency(estimatedProfit) : "—"}</p>
          {packagePrice > 0 && (totalCost + totalExpenseCost) > 0 && <p className="text-xs text-neutral-400 mt-0.5">%{Math.round((estimatedProfit / packagePrice) * 100)} marj</p>}
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><Wallet className="h-3.5 w-3.5 text-blue-500" /> Musteri Bakiye</p>
          <p className={cn("text-xl font-bold", clientDebt > 0 ? "text-red-600" : "text-green-600")}>{packagePrice > 0 || expenseClientBalance > 0 ? formatCurrency(clientDebt) : "—"}</p>
          {clientDebt > 0 && <p className="text-xs text-neutral-400 mt-0.5">tahsil edilmedi</p>}
        </div>
      </div>

      {/* Hizmet Kalemleri */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">Hizmet Kalemleri</h2>
          <Button size="sm" variant="outline" onClick={handleAddCustomItem}><Plus className="h-3.5 w-3.5" /> Satir Ekle</Button>
        </div>
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-sm min-w-[700px]">
              <thead><tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 w-8">#</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Hizmet</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Muellif</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500">Maliyet</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500">Odenen</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500">Kalan</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500">Durum</th>
                <th className="px-4 py-2.5 w-16"></th>
              </tr></thead>
              <tbody>
                <SortableContext items={serviceItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                  {serviceItems.map((item, index) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      index={index}
                      onEdit={openEditItem}
                      onDelete={handleDeleteItem}
                      getPerson={getPerson}
                    />
                  ))}
                </SortableContext>
              </tbody>
              <tfoot><tr className="bg-neutral-50 border-t border-neutral-200">
              <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-neutral-700">TOPLAM</td>
              <td className="px-4 py-3 text-right text-xs font-bold text-neutral-900">{formatCurrency(totalCost)}</td>
              <td className="px-4 py-3 text-right text-xs font-bold text-green-600">{formatCurrency(totalPaidToMuellif)}</td>
              <td className="px-4 py-3 text-right text-xs font-bold text-red-500">{totalRemainingToMuellif > 0 ? formatCurrency(totalRemainingToMuellif) : "✓"}</td>
              <td colSpan={2}></td>
            </tr></tfoot>
          </table>
          </DndContext>
        </div>
      </div>

      {/* Musteri Odeme Takibi */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">Musteri Odeme Takibi</h2>
          <Button size="sm" variant="outline" onClick={() => setAddingPayment(true)}><Plus className="h-3.5 w-3.5" /> Odeme Plani Ekle</Button>
        </div>
        {addingPayment && (
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
            <div className="flex gap-2 items-end flex-wrap">
              <div className="space-y-1"><label className="text-xs text-neutral-500">Baslik</label><Input value={paymentForm.title} onChange={(e) => setPaymentForm((f) => ({ ...f, title: e.target.value }))} placeholder="Avans, 1. Odeme..." className="h-8 text-sm w-36" /></div>
              <div className="space-y-1"><label className="text-xs text-neutral-500">Tutar (TL)</label><Input type="number" value={paymentForm.amount || ""} onChange={(e) => setPaymentForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} placeholder="0" className="h-8 text-sm w-28" /></div>
              <div className="space-y-1"><label className="text-xs text-neutral-500">Vade</label><Input type="date" value={paymentForm.dueDate} onChange={(e) => setPaymentForm((f) => ({ ...f, dueDate: e.target.value }))} className="h-8 text-sm w-36" /></div>
              <Button size="sm" onClick={handleAddPaymentPlan}>Ekle</Button>
              <Button size="sm" variant="outline" onClick={() => setAddingPayment(false)}>Iptal</Button>
            </div>
          </div>
        )}
        {paymentPlans.length === 0 && !addingPayment ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-400">Henuz odeme plani eklenmedi.</div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {paymentPlans.map((plan) => (
              <div key={plan.id} className="flex items-center gap-3 px-4 py-3">
                <input type="checkbox" checked={plan.isPaid} onChange={() => togglePaymentPaid(plan)} className="w-4 h-4 accent-green-600" />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", plan.isPaid && "line-through text-neutral-400")}>{plan.title}</p>
                  <p className="text-xs text-neutral-500">{formatCurrency(plan.amount)}{plan.dueDate && " · Vade: " + new Date(plan.dueDate).toLocaleDateString("tr-TR")}{plan.isPaid && plan.paidDate && " · Odendi: " + new Date(plan.paidDate).toLocaleDateString("tr-TR")}</p>
                </div>
                {plan.isPaid ? <span className="text-xs text-green-600 font-medium">✓ Odendi</span> : <span className="text-xs text-red-500 font-medium">{formatCurrency(plan.amount - plan.paidAmount)} bekliyor</span>}
                <button onClick={() => handleDeletePayment(plan.id)} className="text-neutral-300 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 text-sm font-medium">
              <span className="text-neutral-700">Toplam: {formatCurrency(paymentPlans.reduce((s, p) => s + p.amount, 0))}</span>
              <span className="text-green-600">Tahsil: {formatCurrency(totalReceivedFromClient)}</span>
              <span className={packagePrice - totalReceivedFromClient > 0 ? "text-red-500" : "text-green-600"}>Bakiye: {formatCurrency(packagePrice - totalReceivedFromClient)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Ek Harcamalar */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-neutral-900">Ek Harcamalar</h2>
            <span className="text-xs text-neutral-400">(Isveren adina yapilan masraflar)</span>
          </div>
          <Button size="sm" variant="outline" onClick={openAddExpense}><Plus className="h-3.5 w-3.5" /> Harcama Ekle</Button>
        </div>
        {addingExpense && (
          <div className="px-4 py-4 border-b border-neutral-100 bg-neutral-50 space-y-3">
            <p className="text-xs font-semibold text-neutral-600">{editingExpense ? "Harcamayi Duzenle" : "Yeni Harcama"}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-3">
                <label className="text-xs text-neutral-500">Aciklama *</label>
                <Input value={expenseForm.description} onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} placeholder="Harc, vergi, tapu masrafi..." className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Biz Odedik (TL)</label>
                <Input type="number" min={0} step="0.01" value={expenseForm.cost || ""} onChange={(e) => setExpenseForm((f) => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} placeholder="0" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Isverene Yansitilan (TL)</label>
                <Input type="number" min={0} step="0.01" value={expenseForm.chargeToClient || ""} onChange={(e) => setExpenseForm((f) => ({ ...f, chargeToClient: parseFloat(e.target.value) || 0 }))} placeholder="0" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Not</label>
                <Input value={expenseForm.notes} onChange={(e) => setExpenseForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Isteğe bagli..." className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveExpense}>{editingExpense ? "Guncelle" : "Ekle"}</Button>
              <Button size="sm" variant="outline" onClick={() => { setAddingExpense(false); setEditingExpense(null); }}>Iptal</Button>
            </div>
          </div>
        )}
        {expenses.length === 0 && !addingExpense ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-400">Henuz ek harcama eklenmedi.</div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {expenses.map((exp) => (
              <div key={exp.id} className="flex items-center gap-3 px-4 py-3">
                <input type="checkbox" checked={exp.isPaid} onChange={() => toggleExpensePaid(exp)} className="w-4 h-4 accent-green-600" />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", exp.isPaid && "line-through text-neutral-400")}>{exp.description}</p>
                  <p className="text-xs text-neutral-500">Biz odedik: {formatCurrency(exp.cost)}{exp.chargeToClient > 0 && " · Isverene: " + formatCurrency(exp.chargeToClient)}{exp.notes && " · " + exp.notes}</p>
                </div>
                {exp.isPaid ? <span className="text-xs text-green-600 font-medium shrink-0">✓ Tahsil edildi</span> : exp.chargeToClient > 0 ? <span className="text-xs text-orange-500 font-medium shrink-0">{formatCurrency(exp.chargeToClient)} bekliyor</span> : null}
                <button onClick={() => openEditExpense(exp)} className="p-1 text-neutral-400 hover:text-indigo-600 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => handleDeleteExpense(exp.id)} className="p-1 text-neutral-400 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {expenses.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 text-sm font-medium">
                <span className="text-neutral-700">Bizim Odedigimiz: {formatCurrency(totalExpenseCost)}</span>
                <span className="text-orange-600">Isverene Yansitilan: {formatCurrency(totalExpenseChargeable)}</span>
                <span className={expenseClientBalance > 0 ? "text-red-500" : "text-green-600"}>Tahsil Edilmedi: {formatCurrency(expenseClientBalance)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <ServiceItemDialog open={showItemDialog} onClose={() => { setShowItemDialog(false); setEditingItem(null); }} onSave={handleSaveItem} item={editingItem} persons={persons} serviceCategories={serviceCategories} />
    </div>
  );
}
