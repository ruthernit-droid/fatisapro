"use client";

import { useState } from "react";
import { ProjectTypeItem } from "@/types";
import { FolderKanban, Plus, Trash2, Pencil, Check, X } from "lucide-react";

interface Props {
  projectTypes: ProjectTypeItem[];
  onAdd: (data: Omit<ProjectTypeItem, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdate: (id: string, data: Partial<Omit<ProjectTypeItem, "id" | "createdAt" | "updatedAt">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ProjectTypeManager({ projectTypes, onAdd, onUpdate, onDelete }: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      await onAdd({ name: newName.trim(), order: projectTypes.length + 1 });
      setNewName("");
      setAdding(false);
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
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (busy || !confirm("Bu proje türünü silmek istediğinize emin misiniz?")) return;
    setBusy(true);
    try {
      await onDelete(id);
    } finally {
      setBusy(false);
    }
  }

  const sorted = [...projectTypes].sort((a, b) => a.order - b.order);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-indigo-500" />
          Proje Türleri
        </h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Tür Ekle
          </button>
        )}
      </div>

      <div className="space-y-2">
        {sorted.map((pt) => (
          <div key={pt.id} className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
            {editingId === pt.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleUpdateName(pt.id); if (e.key === "Escape") setEditingId(null); }}
                  className="flex-1 rounded border border-neutral-200 bg-white px-2 py-1 text-sm focus:outline-none focus:border-indigo-400"
                  autoFocus
                />
                <button onClick={() => handleUpdateName(pt.id)} disabled={busy} className="text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></button>
                <button onClick={() => setEditingId(null)} className="text-neutral-400 hover:text-neutral-600"><X className="h-4 w-4" /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-neutral-700">{pt.name}</span>
                <button
                  onClick={() => { setEditingId(pt.id); setEditName(pt.name); }}
                  className="text-neutral-400 hover:text-indigo-600 transition-colors"
                ><Pencil className="h-3.5 w-3.5" /></button>
                <button
                  onClick={() => handleDelete(pt.id)}
                  disabled={busy}
                  className="text-neutral-400 hover:text-red-500 transition-colors"
                ><Trash2 className="h-3.5 w-3.5" /></button>
              </>
            )}
          </div>
        ))}

        {adding && (
          <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
              placeholder="Yeni proje türü adı..."
              className="flex-1 rounded border border-neutral-200 bg-white px-2 py-1 text-sm focus:outline-none focus:border-indigo-400"
              autoFocus
            />
            <button onClick={handleAdd} disabled={busy || !newName.trim()} className="text-green-600 hover:text-green-700 disabled:opacity-40"><Check className="h-4 w-4" /></button>
            <button onClick={() => { setAdding(false); setNewName(""); }} className="text-neutral-400 hover:text-neutral-600"><X className="h-4 w-4" /></button>
          </div>
        )}

        {sorted.length === 0 && !adding && (
          <p className="text-xs text-neutral-400 py-2">Henüz proje türü eklenmedi.</p>
        )}
      </div>
    </div>
  );
}
