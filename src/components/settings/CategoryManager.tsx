"use client";

import { useState } from "react";
import { PersonCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f59e0b", "#84cc16", "#10b981", "#0ea5e9",
  "#0284c7", "#64748b", "#78716c", "#a16207",
];

interface CategoryManagerProps {
  categories: PersonCategory[];
  onAdd: (data: Omit<PersonCategory, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdate: (id: string, data: Partial<Omit<PersonCategory, "id" | "createdAt" | "updatedAt">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EMPTY = { name: "", color: PRESET_COLORS[0] };

export function CategoryManager({
  categories,
  onAdd,
  onUpdate,
  onDelete,
}: CategoryManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PersonCategory | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setNameError("");
    setDialogOpen(true);
  };

  const openEdit = (cat: PersonCategory) => {
    setEditTarget(cat);
    setForm({ name: cat.name, color: cat.color });
    setNameError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setNameError("Kategori adı zorunludur");
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await onUpdate(editTarget.id, { name: form.name.trim(), color: form.color });
      } else {
        await onAdd({
          name: form.name.trim(),
          color: form.color,
          isDefault: false,
          order: categories.length + 1,
        });
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Kişi Kategorileri</CardTitle>
            <CardDescription className="mt-1">
              Kişileri gruplamak için kategori ve tipler tanımlayın.
            </CardDescription>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Yeni Kategori
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.length === 0 && (
            <p className="text-sm text-neutral-400 py-4 text-center">
              Henüz kategori yok.
            </p>
          )}
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3 bg-white hover:bg-neutral-50"
            >
              <GripVertical className="h-4 w-4 text-neutral-300 shrink-0" />
              <span
                className="h-4 w-4 rounded-full shrink-0 border-2 border-white ring-1 ring-neutral-200"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 text-sm font-medium text-neutral-800">
                {cat.name}
              </span>
              {cat.isDefault && (
                <span className="text-[10px] font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                  Varsayılan
                </span>
              )}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => openEdit(cat)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Kategoriyi Sil</AlertDialogTitle>
                      <AlertDialogDescription>
                        <strong>{cat.name}</strong> kategorisini silmek istediğinizden emin misiniz?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(cat.id)}>
                        Sil
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Kategoriyi Düzenle" : "Yeni Kategori"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">
                Kategori Adı <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => {
                  setForm((p) => ({ ...p, name: e.target.value }));
                  if (e.target.value.trim()) setNameError("");
                }}
                placeholder="örn. Alt Yüklenici"
                className={nameError ? "border-red-400" : ""}
              />
              {nameError && (
                <p className="text-xs text-red-500">{nameError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Renk</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, color }))}
                    className="h-7 w-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: form.color === color ? "#111" : "transparent",
                      transform: form.color === color ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Kaydediliyor..." : editTarget ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
