"use client";

import { useState, useEffect } from "react";
import {
  ProjectServiceItem,
  ServiceItemStatus,
  PaymentInstallment,
  Person,
  ServiceCategory,
  SERVICE_ITEM_STATUS_LABELS,
  DEFAULT_SERVICE_NAMES,
} from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PersonCombobox from "@/components/projects/PersonCombobox";
import { Trash2, Plus, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface ServiceItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Omit<ProjectServiceItem, "id" | "createdAt" | "updatedAt">>) => Promise<void>;
  item: ProjectServiceItem | null;
  persons: Person[];
  serviceCategories?: ServiceCategory[];
}

export default function ServiceItemDialog({
  open,
  onClose,
  onSave,
  item,
  persons,
  serviceCategories,
}: ServiceItemDialogProps) {
  const [form, setForm] = useState({
    serviceName: "",
    muellif: "",
    cost: 0,
    plannedPaymentDate: "",
    status: "not_started" as ServiceItemStatus,
    notes: "",
    paymentInstallments: [] as PaymentInstallment[],
  });
  const [saving, setSaving] = useState(false);
  const [quickPayOpen, setQuickPayOpen] = useState(false);
  const [quickPayDate, setQuickPayDate] = useState("");

  useEffect(() => {
    if (item) {
      setForm({
        serviceName: item.serviceName,
        muellif: item.muellif || "",
        cost: item.cost,
        plannedPaymentDate: item.plannedPaymentDate || "",
        status: item.status,
        notes: item.notes || "",
        paymentInstallments: item.paymentInstallments ? [...item.paymentInstallments] : [],
      });
    }
    setQuickPayOpen(false);
  }, [item, open]);

  const paidTotal = form.paymentInstallments
    .filter((i) => i.isPaid)
    .reduce((s, i) => s + i.amount, 0);
  const remaining = form.cost - paidTotal;

  function addInstallment() {
    setForm((f) => ({
      ...f,
      paymentInstallments: [
        ...f.paymentInstallments,
        { id: Math.random().toString(36).slice(2), amount: 0, isPaid: false },
      ],
    }));
  }

  function updateInstallment(id: string, patch: Partial<PaymentInstallment>) {
    setForm((f) => ({
      ...f,
      paymentInstallments: f.paymentInstallments.map((i) =>
        i.id === id ? { ...i, ...patch } : i
      ),
    }));
  }

  function removeInstallment(id: string) {
    setForm((f) => ({
      ...f,
      paymentInstallments: f.paymentInstallments.filter((i) => i.id !== id),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        serviceName: form.serviceName,
        muellif: form.muellif || undefined,
        cost: form.cost,
        plannedPaymentDate: form.plannedPaymentDate || undefined,
        status: form.status,
        notes: form.notes || undefined,
        paymentInstallments: form.paymentInstallments,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hizmet Kalemi Düzenle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hizmet Adı */}
          <div className="space-y-1">
            <Label>Hizmet</Label>
            <div className="flex gap-2">
              <select
                value={form.serviceName}
                onChange={(e) => e.target.value && setForm((f) => ({ ...f, serviceName: e.target.value }))}
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg bg-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Standart seç --</option>
                {serviceCategories && serviceCategories.length > 0 ? (
                  serviceCategories.map((cat) => (
                    <optgroup key={cat.id} label={cat.name}>
                      {cat.subcategories.length > 0 ? (
                        cat.subcategories.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))
                      ) : (
                        <option value={cat.name}>{cat.name}</option>
                      )}
                    </optgroup>
                  ))
                ) : (
                  DEFAULT_SERVICE_NAMES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))
                )}
              </select>
              <Input
                value={form.serviceName}
                onChange={(e) => setForm((f) => ({ ...f, serviceName: e.target.value }))}
                placeholder="Özel isim"
                className="flex-1"
              />
            </div>
          </div>

          {/* Müellif */}
          <div className="space-y-1">
            <Label>Müellif / Alt Yüklenici</Label>
            <PersonCombobox
              value={form.muellif || null}
              onChange={(id) => setForm((f) => ({ ...f, muellif: id }))}
              persons={persons}
              placeholder="Kişi seçin (opsiyonel)"
            />
          </div>

          {/* Maliyet + Durum */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Maliyet (₺)</Label>
                {form.cost > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickPayDate(new Date().toISOString().slice(0, 10));
                      setQuickPayOpen(true);
                    }}
                    className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full transition-colors"
                  >
                    <Zap className="h-3 w-3" />
                    Hızlı Öde
                  </button>
                )}
              </div>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.cost || ""}
                onChange={(e) => setForm((f) => ({ ...f, cost: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <Label>Durum</Label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ServiceItemStatus }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white text-sm focus:outline-none focus:border-blue-500"
              >
                {(Object.entries(SERVICE_ITEM_STATUS_LABELS) as [ServiceItemStatus, string][]).map(
                  ([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Tarih */}
          <div className="space-y-1">
            <Label>Planlanan Ödeme Tarihi</Label>
            <Input
              type="date"
              value={form.plannedPaymentDate}
              onChange={(e) => setForm((f) => ({ ...f, plannedPaymentDate: e.target.value }))}
            />
          </div>

          {/* Quick-pay confirm panel */}
          {quickPayOpen && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Hızlı Ödeme — {form.cost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺ müellife ödenecek
              </p>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-amber-700 shrink-0">Tarih</Label>
                <Input
                  type="date"
                  value={quickPayDate}
                  onChange={(e) => setQuickPayDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm(`${form.cost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺ tutarı ${quickPayDate} tarihinde ödendi olarak kaydetmek istiyor musunuz?`)) return;
                    const newInst: PaymentInstallment = {
                      id: Math.random().toString(36).slice(2),
                      amount: form.cost,
                      isPaid: true,
                      paidDate: quickPayDate || new Date().toISOString().slice(0, 10),
                    };
                    setForm((f) => ({ ...f, paymentInstallments: [...f.paymentInstallments, newInst] }));
                    setQuickPayOpen(false);
                    toast.success("Taksit eklendi. Kayıt için ‘Kaydet’ butonuna basın.");
                  }}
                  className="flex-1 rounded-lg bg-amber-600 text-white text-xs font-semibold py-1.5 hover:bg-amber-700 transition-colors"
                >
                  Ödendi — Onayla
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPayOpen(false)}
                  className="px-3 rounded-lg border border-amber-300 text-amber-700 text-xs hover:bg-amber-100 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          {/* Ödeme Taksitleri */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ödeme Taksitleri</Label>
              <button
                type="button"
                onClick={addInstallment}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Taksit Ekle
              </button>
            </div>

            {form.paymentInstallments.length === 0 ? (
              <p className="text-xs text-neutral-400 py-2">Henüz taksit eklenmedi.</p>
            ) : (
              <div className="space-y-2">
                {form.paymentInstallments.map((inst) => (
                  <div key={inst.id} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={inst.isPaid}
                      onChange={(e) => {
                        const newVal = e.target.checked;
                        const msg = newVal
                          ? `Bu taksiti (${inst.amount > 0 ? `${inst.amount} ₺` : "tutarsız"}) ödendi olarak işaretlemek istiyor musunuz?`
                          : "Bu taksitin ödeme işaretini kaldırmak istiyor musunuz?";
                        if (!confirm(msg)) return;
                        updateInstallment(inst.id, {
                          isPaid: newVal,
                          paidDate: newVal ? new Date().toISOString().slice(0, 10) : undefined,
                        });
                      }}
                      className="w-4 h-4 accent-green-600"
                      title="Ödendi mi?"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={inst.amount || ""}
                      onChange={(e) =>
                        updateInstallment(inst.id, { amount: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Tutar ₺"
                      className="w-28"
                    />
                    <Input
                      type="date"
                      value={inst.dueDate || ""}
                      onChange={(e) => updateInstallment(inst.id, { dueDate: e.target.value || undefined })}
                      className="flex-1 text-xs"
                      title="Vade tarihi"
                    />
                    <Input
                      type="date"
                      value={inst.paidDate || ""}
                      onChange={(e) => updateInstallment(inst.id, { paidDate: e.target.value || undefined })}
                      className="flex-1 text-xs"
                      title="Gerçekleşen tarih"
                    />
                    <button
                      type="button"
                      onClick={() => removeInstallment(inst.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="text-xs text-neutral-500 text-right">
                  Ödenen: {formatCurrency(paidTotal)} | Kalan: {formatCurrency(remaining)}
                </div>
              </div>
            )}
          </div>

          {/* Notlar */}
          <div className="space-y-1">
            <Label>Notlar</Label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg resize-none focus:outline-none focus:border-blue-500"
              placeholder="İsteğe bağlı notlar..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              İptal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
