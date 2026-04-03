"use client";

import { useState } from "react";
import { ServiceCategory } from "@/types";
import { Layers, Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  categories: ServiceCategory[];
  onAdd: (data: Omit<ServiceCategory, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdate: (id: string, data: Partial<Omit<ServiceCategory, "id" | "createdAt" | "updatedAt">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ServiceCategoryManager({ categories, onAdd, onUpdate, onDelete }: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [subcatInputs, setSubcatInputs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function getSubcatInput(catId: string) { return subcatInputs[catId] ?? ""; }
  function setSubcatInput(catId: string, val: string) {
    setSubcatInputs(prev => ({ ...prev, [catId]: val }));
  }

  async function handleAdd() {
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      await onAdd({ name: newName.trim(), subcategories: [], order: categories.length + 1 });
      setNewName("");
      setAdding(false);
      toast.success("Kategori eklendi");
    } catch (e) {
      console.error(e);
      toast.error("Kategori eklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateName(id: string) {
    if (!editName.trim() || busy) return;
    setBusy(true);
    try {
      await onUpdate(id, { name: editName.trim() });
      setEditingId(null);
      toast.success("Güncellendi");
    } catch (e) {
      console.error(e);
      toast.error("Güncellenemedi");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddSubcat(cat: ServiceCategory) {
    const val = getSubcatInput(cat.id);
    if (!val.trim() || busy) return;
    setBusy(true);
    try {
      await onUpdate(cat.id, { subcategories: [...cat.subcategories, val.trim()] });
      setSubcatInput(cat.id, "");
      toast.success("Alt kategori eklendi");
    } catch (e) {
      console.error(e);
      toast.error("Alt kategori eklenemedi");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveSubcat(cat: ServiceCategory, idx: number) {
    if (busy) return;
    setBusy(true);
    try {
      await onUpdate(cat.id, { subcategories: cat.subcategories.filter((_, i) => i !== idx) });
      toast.success("Alt kategori silindi");
    } catch (e) {
      console.error(e);
      toast.error("Silinemedi");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      await onDelete(id);
      if (expandedId === id) setExpandedId(null);
      toast.success("Kategori silindi");
    } catch (e) {
      console.error(e);
      toast.error("Silinemedi");
    } finally {
      setBusy(false);
    }
  }

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-500" />
          Hizmet Kategorileri
        </h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Kategori Ekle
          </button>
        )}
      </div>

      <div className="space-y-2">
        {sorted.map((cat) => (
          <div key={cat.id} className="rounded-lg border border-neutral-100 bg-neutral-50 overflow-hidden">
            {/* Main row */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button
                onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                className="text-neutral-400 hover:text-neutral-600 shrink-0"
              >
                {expandedId === cat.id
                  ? <ChevronDown className="h-4 w-4" />
                  : <ChevronRight className="h-4 w-4" />}
              </button>

              {editingId === cat.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateName(cat.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 rounded border border-neutral-300 px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdateName(cat.id)}
                    disabled={busy}
                    className="text-green-600 hover:text-green-700 disabled:opacity-40 shrink-0"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-neutral-400 hover:text-neutral-600 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-neutral-800">{cat.name}</span>
                  <span className="text-xs text-neutral-400 shrink-0">
                    {cat.subcategories.length} alt
                  </span>
                  <button
                    onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                    className="text-neutral-400 hover:text-neutral-600 shrink-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={busy}
                    className="text-neutral-400 hover:text-red-500 disabled:opacity-40 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Expanded subcategories */}
            {expandedId === cat.id && (
              <div className="border-t border-neutral-100 px-4 py-3">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {cat.subcategories.length === 0 ? (
                    <span className="text-xs text-neutral-400">Alt kategori yok</span>
                  ) : (
                    cat.subcategories.map((sub, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700"
                      >
                        {sub}
                        <button
                          onClick={() => handleRemoveSubcat(cat, idx)}
                          disabled={busy}
                          className="text-indigo-300 hover:text-red-500 disabled:opacity-40"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={getSubcatInput(cat.id)}
                    onChange={(e) => setSubcatInput(cat.id, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddSubcat(cat); }}
                    placeholder="Yeni alt kategori..."
                    className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleAddSubcat(cat)}
                    disabled={!getSubcatInput(cat.id).trim() || busy}
                    className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 transition-colors"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add new category inline */}
        {adding && (
          <div className="flex gap-2 pt-1">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") { setAdding(false); setNewName(""); }
              }}
              placeholder="Ana kategori adı..."
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              Ekle
            </button>
            <button
              onClick={() => { setAdding(false); setNewName(""); }}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {categories.length === 0 && !adding && (
          <p className="py-6 text-center text-xs text-neutral-400">
            Henüz hizmet kategorisi eklenmemiş.
          </p>
        )}
      </div>
    </div>
  );
}
