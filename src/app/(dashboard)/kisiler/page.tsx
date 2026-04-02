"use client";

import { useState, useMemo } from "react";
import { usePersons } from "@/hooks/usePersons";
import { useCategories } from "@/hooks/useCategories";
import { PersonCard } from "@/components/persons/PersonCard";
import { PersonDialog } from "@/components/persons/PersonDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Person, PersonCategory } from "@/types";
import { Plus, Search, Users, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export default function KisilerPage() {
  const { persons, loading, add, update, remove } = usePersons();
  const { categories } = useCategories();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Person | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return persons.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search) ||
        (p.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.companyName || "").toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        !filterCategoryId || p.categoryIds.includes(filterCategoryId);

      return matchSearch && matchCategory;
    });
  }, [persons, search, filterCategoryId]);

  const openAdd = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (person: Person) => {
    setEditTarget(person);
    setDialogOpen(true);
  };

  const handleSave = async (data: Omit<Person, "id" | "createdAt" | "updatedAt">) => {
    if (editTarget) {
      await update(editTarget.id, data);
    } else {
      await add(data);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Kişiler</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {persons.length} kişi kayıtlı
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Kişi Ekle
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim, telefon, e-posta veya firma ara..."
            className="pl-9"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterCategoryId(null)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
              filterCategoryId === null
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
            )}
          >
            <Filter className="h-3 w-3" />
            Tümü
          </button>
          {categories.map((cat: PersonCategory) => (
            <button
              key={cat.id}
              onClick={() =>
                setFilterCategoryId(
                  filterCategoryId === cat.id ? null : cat.id
                )
              }
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                filterCategoryId === cat.id
                  ? "text-white border-transparent"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
              )}
              style={
                filterCategoryId === cat.id
                  ? { backgroundColor: cat.color, borderColor: cat.color }
                  : {}
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
            <Users className="h-7 w-7 text-neutral-400" />
          </div>
          {persons.length === 0 ? (
            <>
              <p className="text-base font-medium text-neutral-700">
                Henüz kişi eklenmedi
              </p>
              <p className="text-sm text-neutral-400 mt-1 mb-4">
                İlk kişiyi ekleyerek başlayın.
              </p>
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" />
                İlk Kişiyi Ekle
              </Button>
            </>
          ) : (
            <>
              <p className="text-base font-medium text-neutral-700">
                Arama sonucu bulunamadı
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                Farklı bir arama terimi deneyin.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              categories={categories}
              onEdit={openEdit}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <PersonDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        person={editTarget}
        categories={categories}
      />
    </div>
  );
}
