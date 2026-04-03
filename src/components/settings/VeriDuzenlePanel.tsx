"use client";

import { useState, useCallback } from "react";
import {
  AlertTriangle,
  Trash2,
  RotateCcw,
  DollarSign,
  FileX,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Project, ProjectPaymentPlan, ProjectServiceItem, Quote } from "@/types";
import { getProjects } from "@/lib/firestore/projects";
import { getPaymentPlans } from "@/lib/firestore/projectPaymentPlans";
import { getServiceItems } from "@/lib/firestore/projectServiceItems";
import { getQuotes } from "@/lib/firestore/quotes";
import {
  getProjectCascadePreview,
  deleteProjectWithCascade,
  markPaymentPlanItemUnpaid,
  markServiceInstallmentUnpaid,
  fixServiceItemCost,
  deleteQuoteCorrection,
  CascadePreview,
} from "@/lib/firestore/corrections";

type OperationType =
  | "delete_project"
  | "unpaid_payment_plan"
  | "unpaid_installment"
  | "fix_cost"
  | "delete_quote";

const OPERATIONS: { id: OperationType; label: string; description: string; icon: React.FC<{ className?: string }> }[] = [
  {
    id: "delete_project",
    label: "Projeyi Tüm Verileriyle Sil",
    description: "Proje + tüm hizmet kalemleri, ödeme planları, giderler ve teklifler kalıcı olarak silinir",
    icon: Trash2,
  },
  {
    id: "unpaid_payment_plan",
    label: "Ödeme Planı Kalemini Ödenmedi Yap",
    description: "Yanlışlıkla ödendi işaretlenmiş bir ödeme planı kalemini düzelt",
    icon: RotateCcw,
  },
  {
    id: "unpaid_installment",
    label: "Hizmet Kalemi Taksitini Ödenmedi Yap",
    description: "Yanlışlıkla ödendi işaretlenmiş bir hizmet kalemi taksitini düzelt",
    icon: RotateCcw,
  },
  {
    id: "fix_cost",
    label: "Hizmet Kalemi Maliyetini Düzelt",
    description: "Yanlış girilen hizmet kalemi maliyetini güncelle",
    icon: DollarSign,
  },
  {
    id: "delete_quote",
    label: "Teklifi Sil",
    description: "Yanlışlıkla oluşturulan bir teklifi kalıcı olarak sil",
    icon: FileX,
  },
];

// ---------------------------------------------------------------------------

function fmt(n: number) {
  return n.toLocaleString("tr-TR") + " ₺";
}

// ---------------------------------------------------------------------------

interface StepSelectProjectProps {
  onSelect: (p: Project) => void;
}
function StepSelectProject({ onSelect }: StepSelectProjectProps) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (projects !== null) return;
    setLoading(true);
    try {
      const list = await getProjects();
      setProjects(list);
    } catch {
      toast.error("Projeler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [projects]);

  if (projects === null && !loading) {
    return (
      <button
        onClick={load}
        className="w-full rounded-lg border-2 border-dashed border-neutral-200 py-6 text-sm text-neutral-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
      >
        Projeleri Yükle
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-neutral-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {(projects ?? []).map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className="w-full flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
        >
          <div>
            <p className="text-sm font-medium text-neutral-800">{p.title}</p>
            {p.projectNo && <p className="text-xs text-neutral-400">{p.projectNo}</p>}
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0" />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function VeriDuzenlePanel() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [operation, setOperation] = useState<OperationType | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [done, setDone] = useState(false);

  // Per-operation selection state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [cascadePreview, setCascadePreview] = useState<CascadePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [paymentPlans, setPaymentPlans] = useState<ProjectPaymentPlan[] | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ProjectPaymentPlan | null>(null);

  const [serviceItems, setServiceItems] = useState<ProjectServiceItem[] | null>(null);
  const [selectedItem, setSelectedItem] = useState<ProjectServiceItem | null>(null);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null);

  const [newCost, setNewCost] = useState("");

  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  function reset() {
    setStep(1);
    setOperation(null);
    setConfirmed(false);
    setExecuting(false);
    setDone(false);
    setSelectedProject(null);
    setCascadePreview(null);
    setPaymentPlans(null);
    setSelectedPlan(null);
    setServiceItems(null);
    setSelectedItem(null);
    setSelectedInstallmentId(null);
    setNewCost("");
    setQuotes(null);
    setSelectedQuote(null);
  }

  async function handleSelectOperation(op: OperationType) {
    setOperation(op);
    setStep(2);
  }

  async function handleSelectProjectForDelete(project: Project) {
    setSelectedProject(project);
    setPreviewLoading(true);
    try {
      const preview = await getProjectCascadePreview(project.id);
      setCascadePreview(preview);
    } catch {
      toast.error("Önizleme yüklenemedi");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSelectProjectForPlans(project: Project) {
    setSelectedProject(project);
    setPreviewLoading(true);
    try {
      const plans = await getPaymentPlans(project.id);
      setPaymentPlans(plans.filter(p => p.isPaid));
    } catch {
      toast.error("Ödeme planları yüklenemedi");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSelectProjectForItems(project: Project) {
    setSelectedProject(project);
    setPreviewLoading(true);
    try {
      const items = await getServiceItems(project.id);
      setServiceItems(items);
    } catch {
      toast.error("Hizmet kalemleri yüklenemedi");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSelectProjectForCost(project: Project) {
    setSelectedProject(project);
    setPreviewLoading(true);
    try {
      const items = await getServiceItems(project.id);
      setServiceItems(items);
    } catch {
      toast.error("Hizmet kalemleri yüklenemedi");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function loadQuotes() {
    setPreviewLoading(true);
    try {
      const all = await getQuotes();
      setQuotes(all);
    } catch {
      toast.error("Teklifler yüklenemedi");
    } finally {
      setPreviewLoading(false);
    }
  }

  function canProceedToStep3(): boolean {
    switch (operation) {
      case "delete_project": return cascadePreview !== null;
      case "unpaid_payment_plan": return selectedPlan !== null;
      case "unpaid_installment": return selectedInstallmentId !== null;
      case "fix_cost": return selectedItem !== null && newCost.trim() !== "" && !isNaN(Number(newCost));
      case "delete_quote": return selectedQuote !== null;
      default: return false;
    }
  }

  async function execute() {
    if (!confirmed || executing) return;
    setExecuting(true);
    try {
      switch (operation) {
        case "delete_project": {
          if (!selectedProject) throw new Error("Proje seçilmedi");
          await deleteProjectWithCascade(selectedProject.id);
          toast.success("Proje ve tüm bağlı veriler silindi");
          break;
        }
        case "unpaid_payment_plan": {
          if (!selectedPlan) throw new Error("Ödeme planı kalemi seçilmedi");
          await markPaymentPlanItemUnpaid(selectedPlan.id);
          toast.success("Ödeme planı kalemi ödenmedi olarak güncellendi");
          break;
        }
        case "unpaid_installment": {
          if (!selectedItem || !selectedInstallmentId) throw new Error("Taksit seçilmedi");
          await markServiceInstallmentUnpaid(selectedItem.id, selectedInstallmentId);
          toast.success("Taksit ödenmedi olarak güncellendi");
          break;
        }
        case "fix_cost": {
          if (!selectedItem) throw new Error("Hizmet kalemi seçilmedi");
          await fixServiceItemCost(selectedItem.id, Number(newCost));
          toast.success("Maliyet güncellendi");
          break;
        }
        case "delete_quote": {
          if (!selectedQuote) throw new Error("Teklif seçilmedi");
          await deleteQuoteCorrection(selectedQuote.id);
          toast.success("Teklif silindi");
          break;
        }
      }
      setDone(true);
    } catch (e) {
      console.error(e);
      toast.error("İşlem başarısız. Lütfen tekrar deneyin.");
    } finally {
      setExecuting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 1 — İşlem seç
  // ---------------------------------------------------------------------------
  if (step === 1) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-neutral-500 mb-4">
          Gerçekleştirmek istediğiniz düzeltme işlemini seçin. Her işlem 3 adımda onaylanır.
        </p>
        {OPERATIONS.map((op) => {
          const Icon = op.icon;
          return (
            <button
              key={op.id}
              onClick={() => handleSelectOperation(op.id)}
              className="w-full flex items-start gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left hover:border-red-300 hover:bg-red-50 transition-colors group"
            >
              <Icon className="h-4 w-4 text-neutral-400 group-hover:text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-neutral-800">{op.label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{op.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-red-400 shrink-0 ml-auto mt-0.5" />
            </button>
          );
        })}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STEP 2 — Kayıt seç
  // ---------------------------------------------------------------------------
  if (step === 2) {
    const OpIcon = OPERATIONS.find(o => o.id === operation)?.icon ?? AlertTriangle;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <button onClick={reset} className="text-neutral-400 hover:text-neutral-600">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
            <OpIcon className="h-4 w-4 text-red-500" />
            {OPERATIONS.find(o => o.id === operation)?.label}
          </h3>
        </div>

        {/* ---- DELETE PROJECT ---- */}
        {operation === "delete_project" && (
          <div className="space-y-3">
            {!selectedProject ? (
              <>
                <p className="text-xs text-neutral-500">Silmek istediğiniz projeyi seçin:</p>
                <StepSelectProject onSelect={handleSelectProjectForDelete} />
              </>
            ) : previewLoading ? (
              <div className="flex items-center justify-center py-8 text-neutral-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Önizleme yükleniyor...
              </div>
            ) : cascadePreview ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-800 mb-3">
                    Silinecek kayıtlar — <span className="font-bold">{cascadePreview.projectTitle}</span>
                  </p>
                  <ul className="space-y-1.5 text-sm text-red-700">
                    <li className="flex justify-between"><span>Proje</span><span className="font-medium">1 kayıt</span></li>
                    <li className="flex justify-between"><span>Hizmet Kalemleri</span><span className="font-medium">{cascadePreview.serviceItemsCount} kayıt</span></li>
                    <li className="flex justify-between"><span>Ödeme Planları</span><span className="font-medium">{cascadePreview.paymentPlansCount} kayıt</span></li>
                    <li className="flex justify-between"><span>Giderler</span><span className="font-medium">{cascadePreview.expensesCount} kayıt</span></li>
                    <li className="flex justify-between"><span>Teklifler</span><span className="font-medium">{cascadePreview.quotesCount} kayıt</span></li>
                  </ul>
                </div>
                <button
                  onClick={() => { setConfirmed(false); setStep(3); }}
                  disabled={!canProceedToStep3()}
                  className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
                >
                  Devam Et → Onay Adımı
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* ---- UNPAID PAYMENT PLAN ---- */}
        {operation === "unpaid_payment_plan" && (
          <div className="space-y-3">
            {!selectedProject ? (
              <>
                <p className="text-xs text-neutral-500">Önce projeyi seçin:</p>
                <StepSelectProject onSelect={handleSelectProjectForPlans} />
              </>
            ) : previewLoading ? (
              <div className="flex items-center justify-center py-8 text-neutral-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Yükleniyor...
              </div>
            ) : paymentPlans !== null ? (
              <>
                <p className="text-xs text-neutral-500">
                  Ödenmedi yapılacak kalem ({selectedProject.title}):
                </p>
                {paymentPlans.length === 0 ? (
                  <p className="text-sm text-neutral-400 py-4 text-center">Ödenmiş ödeme planı kalemi yok</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {paymentPlans.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlan(p)}
                        className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                          selectedPlan?.id === p.id
                            ? "border-red-400 bg-red-50"
                            : "border-neutral-200 bg-white hover:border-red-300 hover:bg-red-50"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{p.title}</p>
                          <p className="text-xs text-neutral-500">{fmt(p.paidAmount)} ödendi{p.paidDate ? ` — ${p.paidDate}` : ""}</p>
                        </div>
                        {selectedPlan?.id === p.id && <CheckCircle2 className="h-4 w-4 text-red-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
                {selectedPlan && (
                  <button
                    onClick={() => { setConfirmed(false); setStep(3); }}
                    className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                  >
                    Devam Et → Onay Adımı
                  </button>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* ---- UNPAID INSTALLMENT ---- */}
        {operation === "unpaid_installment" && (
          <div className="space-y-3">
            {!selectedProject ? (
              <>
                <p className="text-xs text-neutral-500">Önce projeyi seçin:</p>
                <StepSelectProject onSelect={handleSelectProjectForItems} />
              </>
            ) : previewLoading ? (
              <div className="flex items-center justify-center py-8 text-neutral-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Yükleniyor...
              </div>
            ) : serviceItems !== null ? (
              <>
                {!selectedItem ? (
                  <>
                    <p className="text-xs text-neutral-500">Hizmet kalemini seçin ({selectedProject.title}):</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {serviceItems.filter(s => s.paymentInstallments.some(i => i.isPaid)).map(item => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="w-full flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left hover:border-red-300 hover:bg-red-50 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-neutral-800">{item.serviceName}</p>
                            <p className="text-xs text-neutral-500">{item.paymentInstallments.filter(i => i.isPaid).length} ödenmiş taksit</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0" />
                        </button>
                      ))}
                      {serviceItems.filter(s => s.paymentInstallments.some(i => i.isPaid)).length === 0 && (
                        <p className="text-sm text-neutral-400 py-4 text-center">Ödenmiş taksit bulunamadı</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-neutral-500">
                      Taksiti seçin — <span className="font-medium">{selectedItem.serviceName}</span>:
                    </p>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedItem.paymentInstallments.filter(i => i.isPaid).map((inst, idx) => (
                        <button
                          key={inst.id}
                          onClick={() => setSelectedInstallmentId(inst.id)}
                          className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                            selectedInstallmentId === inst.id
                              ? "border-red-400 bg-red-50"
                              : "border-neutral-200 bg-white hover:border-red-300 hover:bg-red-50"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-neutral-800">Taksit {idx + 1}</p>
                            <p className="text-xs text-neutral-500">{fmt(inst.amount)}{inst.paidDate ? ` — ${inst.paidDate}` : ""}</p>
                          </div>
                          {selectedInstallmentId === inst.id && <CheckCircle2 className="h-4 w-4 text-red-500 shrink-0" />}
                        </button>
                      ))}
                    </div>
                    {selectedInstallmentId && (
                      <button
                        onClick={() => { setConfirmed(false); setStep(3); }}
                        className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                      >
                        Devam Et → Onay Adımı
                      </button>
                    )}
                  </>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* ---- FIX COST ---- */}
        {operation === "fix_cost" && (
          <div className="space-y-3">
            {!selectedProject ? (
              <>
                <p className="text-xs text-neutral-500">Önce projeyi seçin:</p>
                <StepSelectProject onSelect={handleSelectProjectForCost} />
              </>
            ) : previewLoading ? (
              <div className="flex items-center justify-center py-8 text-neutral-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Yükleniyor...
              </div>
            ) : serviceItems !== null ? (
              <>
                {!selectedItem ? (
                  <>
                    <p className="text-xs text-neutral-500">Hizmet kalemini seçin ({selectedProject.title}):</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {serviceItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => { setSelectedItem(item); setNewCost(String(item.cost)); }}
                          className="w-full flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-neutral-800">{item.serviceName}</p>
                            <p className="text-xs text-neutral-500">Mevcut maliyet: {fmt(item.cost)}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-neutral-500">
                      Yeni maliyet — <span className="font-medium">{selectedItem.serviceName}</span>:
                    </p>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        value={newCost}
                        onChange={e => setNewCost(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-neutral-500">₺</span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Mevcut değer: <span className="font-medium">{fmt(selectedItem.cost)}</span>
                    </p>
                    <button
                      onClick={() => { setConfirmed(false); setStep(3); }}
                      disabled={!newCost.trim() || isNaN(Number(newCost))}
                      className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                    >
                      Devam Et → Onay Adımı
                    </button>
                  </>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* ---- DELETE QUOTE ---- */}
        {operation === "delete_quote" && (
          <div className="space-y-3">
            {quotes === null ? (
              <>
                <p className="text-xs text-neutral-500">Teklifleri yükleyin:</p>
                {previewLoading ? (
                  <div className="flex items-center justify-center py-8 text-neutral-400">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Yükleniyor...
                  </div>
                ) : (
                  <button
                    onClick={loadQuotes}
                    className="w-full rounded-lg border-2 border-dashed border-neutral-200 py-6 text-sm text-neutral-500 hover:border-red-300 hover:text-red-600 transition-colors"
                  >
                    Teklifleri Yükle
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-xs text-neutral-500">Silmek istediğiniz teklifi seçin:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {quotes.map(q => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuote(q)}
                      className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                        selectedQuote?.id === q.id
                          ? "border-red-400 bg-red-50"
                          : "border-neutral-200 bg-white hover:border-red-300 hover:bg-red-50"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-800">{q.title || q.quoteNo}</p>
                        <p className="text-xs text-neutral-500">{q.quoteNo} — {fmt(q.grandTotal)}</p>
                      </div>
                      {selectedQuote?.id === q.id && <CheckCircle2 className="h-4 w-4 text-red-500 shrink-0" />}
                    </button>
                  ))}
                </div>
                {selectedQuote && (
                  <button
                    onClick={() => { setConfirmed(false); setStep(3); }}
                    className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                  >
                    Devam Et → Onay Adımı
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // DONE state
  // ---------------------------------------------------------------------------
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <div>
          <p className="text-base font-semibold text-neutral-800">İşlem Tamamlandı</p>
          <p className="text-sm text-neutral-500 mt-1">Düzeltme başarıyla uygulandı.</p>
        </div>
        <button
          onClick={reset}
          className="rounded-lg bg-neutral-100 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
        >
          Yeni İşlem Başlat
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STEP 3 — Onayla
  // ---------------------------------------------------------------------------
  function getSummaryLines(): string[] {
    switch (operation) {
      case "delete_project":
        return cascadePreview
          ? [
              `Proje: ${cascadePreview.projectTitle}`,
              `${cascadePreview.serviceItemsCount} hizmet kalemi`,
              `${cascadePreview.paymentPlansCount} ödeme planı kalemi`,
              `${cascadePreview.expensesCount} gider kaydı`,
              `${cascadePreview.quotesCount} teklif`,
              "⚠️ Bu veriler kalıcı olarak silinir ve geri alınamaz.",
            ]
          : [];
      case "unpaid_payment_plan":
        return selectedPlan
          ? [
              `Ödeme Planı: ${selectedPlan.title}`,
              `Proje: ${selectedProject?.title}`,
              `${fmt(selectedPlan.paidAmount)} tutarındaki ödeme iptal edilecek`,
              "Kalemin durumu 'Ödenmedi' olarak güncellenecek",
            ]
          : [];
      case "unpaid_installment":
        return selectedItem && selectedInstallmentId
          ? [
              `Hizmet Kalemi: ${selectedItem.serviceName}`,
              `Proje: ${selectedProject?.title}`,
              "Seçili taksit 'Ödenmedi' olarak işaretlenecek",
            ]
          : [];
      case "fix_cost":
        return selectedItem
          ? [
              `Hizmet Kalemi: ${selectedItem.serviceName}`,
              `Proje: ${selectedProject?.title}`,
              `Mevcut maliyet: ${fmt(selectedItem.cost)}`,
              `Yeni maliyet: ${fmt(Number(newCost))}`,
            ]
          : [];
      case "delete_quote":
        return selectedQuote
          ? [
              `Teklif: ${selectedQuote.title || selectedQuote.quoteNo}`,
              `Tutar: ${fmt(selectedQuote.grandTotal)}`,
              "⚠️ Bu teklif kalıcı olarak silinir ve geri alınamaz.",
            ]
          : [];
      default:
        return [];
    }
  }

  const isDestructive = operation === "delete_project" || operation === "delete_quote";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => { setStep(2); setConfirmed(false); }} className="text-neutral-400 hover:text-neutral-600">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold text-neutral-700">
          Son Onay — {OPERATIONS.find(o => o.id === operation)?.label}
        </h3>
      </div>

      {/* Summary */}
      <div className={`rounded-lg border p-4 ${isDestructive ? "border-red-300 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
        <p className={`text-xs font-semibold mb-2 uppercase tracking-wide ${isDestructive ? "text-red-700" : "text-amber-700"}`}>
          Yapılacak İşlem
        </p>
        <ul className="space-y-1">
          {getSummaryLines().map((line, i) => (
            <li key={i} className={`text-sm ${isDestructive ? "text-red-800" : "text-amber-800"}`}>
              {line}
            </li>
          ))}
        </ul>
      </div>

      {/* Confirmation checkbox */}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={e => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-red-600"
        />
        <span className="text-sm text-neutral-700">
          Bu işlemi anladım ve geri alınamayacağının farkındayım. Onaylıyorum.
        </span>
      </label>

      {/* Execute */}
      <button
        onClick={execute}
        disabled={!confirmed || executing}
        className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40 ${
          isDestructive ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
        }`}
      >
        {executing && <Loader2 className="h-4 w-4 animate-spin" />}
        {executing ? "İşleniyor..." : "İşlemi Gerçekleştir"}
      </button>
    </div>
  );
}
