"use client";

import { useState } from "react";
import { Person, PersonCategory, ProjectType, PROJECT_TYPE_LABELS } from "@/types";
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
import { PersonDialog } from "@/components/persons/PersonDialog";
import PersonCombobox from "@/components/projects/PersonCombobox";

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    type: ProjectType;
    neighborhood: string;
    parcel: string;
    clientId: string;
    notes: string;
  }) => Promise<void>;
  persons: Person[];
  categories: PersonCategory[];
  onPersonAdded: (person: Person) => void;
}

const EMPTY = {
  title: "",
  type: "architectural_project" as ProjectType,
  neighborhood: "",
  parcel: "",
  clientId: "",
  notes: "",
};

export default function ProjectDialog({
  open,
  onClose,
  onSave,
  persons,
  categories,
  onPersonAdded,
}: ProjectDialogProps) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPersonDialog, setShowPersonDialog] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");

  function reset() {
    setForm(EMPTY);
    setErrors({});
    setSaving(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Proje adı zorunludur.";
    if (!form.clientId) e.clientId = "İşveren seçiniz.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave({ ...form });
      reset();
    } finally {
      setSaving(false);
    }
  }

  async function handlePersonSave(
    data: Omit<Person, "id" | "createdAt" | "updatedAt">
  ) {
    // PersonDialog parent'ın hook'unu çağırır, yeni kişi oluşturulur
    // onPersonAdded ile list güncellenir
    const { addPerson } = await import("@/lib/firestore/persons");
    const id = await addPerson(data);
    const newPerson: Person = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    onPersonAdded(newPerson);
    setForm((f) => ({ ...f, clientId: id }));
    setShowPersonDialog(false);
  }

  return (
    <>
      <Dialog open={open && !showPersonDialog} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Proje</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Proje adı */}
            <div className="space-y-1">
              <Label htmlFor="title">Proje Adı *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Örn: Ahmet Bey Konutu"
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* Proje türü */}
            <div className="space-y-1">
              <Label htmlFor="type">Proje Türü</Label>
              <select
                id="type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ProjectType }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-white text-sm focus:outline-none focus:border-blue-500"
              >
                {(Object.entries(PROJECT_TYPE_LABELS) as [ProjectType, string][]).map(
                  ([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  )
                )}
              </select>
            </div>

            {/* Mahalle + Ada/Parsel */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="neighborhood">Mahalle</Label>
                <Input
                  id="neighborhood"
                  value={form.neighborhood}
                  onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
                  placeholder="Mahalle adı"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="parcel">Ada / Parsel</Label>
                <Input
                  id="parcel"
                  value={form.parcel}
                  onChange={(e) => setForm((f) => ({ ...f, parcel: e.target.value }))}
                  placeholder="Örn: 123/4"
                />
              </div>
            </div>

            {/* İşveren */}
            <div className="space-y-1">
              <Label>İşveren *</Label>
              <PersonCombobox
                value={form.clientId || null}
                onChange={(id) => setForm((f) => ({ ...f, clientId: id }))}
                persons={persons}
                placeholder="İşveren seçin veya ekleyin"
                onAddNew={(name) => {
                  setNewPersonName(name);
                  setShowPersonDialog(true);
                }}
              />
              {errors.clientId && <p className="text-xs text-red-500">{errors.clientId}</p>}
            </div>

            {/* Notlar */}
            <div className="space-y-1">
              <Label htmlFor="notes">Notlar</Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg resize-none focus:outline-none focus:border-blue-500"
                placeholder="İsteğe bağlı notlar..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
                İptal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Kaydediliyor..." : "Proje Oluştur"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inline kişi ekleme alt dialog */}
      <PersonDialog
        open={showPersonDialog}
        onClose={() => setShowPersonDialog(false)}
        onSave={handlePersonSave}
        categories={categories}
        initialName={newPersonName}
      />
    </>
  );
}
