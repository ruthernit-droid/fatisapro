"use client";

import { useState, useEffect } from "react";
import { Person, PersonCategory } from "@/types";
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
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface PersonDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Person, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  person?: Person | null;
  categories: PersonCategory[];
  /** ProjectDialog'dan açılınca isim alanına önceden doldur */
  initialName?: string;
}

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  companyName: "",
  address: "",
  notes: "",
  categoryIds: [] as string[],
};

export function PersonDialog({
  open,
  onClose,
  onSave,
  person,
  categories,
  initialName = "",
}: PersonDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    if (person) {
      setForm({
        name: person.name,
        phone: person.phone,
        email: person.email || "",
        companyName: person.companyName || "",
        address: person.address || "",
        notes: person.notes || "",
        categoryIds: person.categoryIds || [],
      });
    } else {
      setForm({ ...EMPTY_FORM, name: initialName });
    }
    setErrors({});
  }, [person, open, initialName]);

  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  };

  const validate = () => {
    const e: { name?: string; phone?: string } = {};
    if (!form.name.trim()) e.name = "İsim zorunludur";
    if (!form.phone.trim()) e.phone = "Telefon zorunludur";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
        categoryIds: form.categoryIds,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {person ? "Kişiyi Düzenle" : "Yeni Kişi Ekle"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              İsim <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Ad Soyad"
              className={errors.name ? "border-red-400" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Telefon <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              placeholder="0 (5xx) xxx xx xx"
              className={errors.phone ? "border-red-400" : ""}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="ornek@eposta.com"
            />
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label htmlFor="company">Firma / Şirket</Label>
            <Input
              id="company"
              value={form.companyName}
              onChange={(e) =>
                setForm((p) => ({ ...p, companyName: e.target.value }))
              }
              placeholder="Firma adı"
            />
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>Kategoriler</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = form.categoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all",
                        selected
                          ? "text-white border-transparent"
                          : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                      )}
                      style={
                        selected
                          ? { backgroundColor: cat.color, borderColor: cat.color }
                          : {}
                      }
                    >
                      {selected && <Check className="h-3 w-3" />}
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notlar</Label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="İsteğe bağlı notlar..."
              rows={2}
              className="flex w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Kaydediliyor..." : person ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
