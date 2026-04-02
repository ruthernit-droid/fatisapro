"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Project,
  ProjectStatus,
  ProjectType,
  Person,
  PersonCategory,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
} from "@/types";
import { getProjects, addProject } from "@/lib/firestore/projects";
import { getPersons } from "@/lib/firestore/persons";
import { createDefaultServiceItems } from "@/lib/firestore/projectServiceItems";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  Plus,
  Search,
  Calendar,
  User,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import ProjectDialog from "@/components/projects/ProjectDialog";

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft:     "bg-neutral-100 text-neutral-600 border-neutral-200",
  active:    "bg-green-100 text-green-700 border-green-200",
  on_hold:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  archived:  "bg-neutral-100 text-neutral-500 border-neutral-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
};

export default function ProjelerPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "all">("all");
  const [showDialog, setShowDialog] = useState(false);
  const { categories } = useCategories();

  const loadData = useCallback(() => {
    Promise.all([getProjects(), getPersons()])
      .then(([p, pe]) => {
        setProjects(p);
        setPersons(pe);
      })
      .catch(() => toast.error("Projeler yÃ¼klenemedi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = projects.filter((p) => {
    const matchSearch =
      !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.projectNo || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getClient = (id: string) => persons.find((p) => p.id === id);

  const statusCounts = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  async function handleCreateProject(data: {
    title: string;
    type: ProjectType;
    neighborhood: string;
    parcel: string;
    clientId: string;
    notes: string;
  }) {
    const projectId = await addProject({
      title: data.title,
      type: data.type,
      neighborhood: data.neighborhood || undefined,
      parcel: data.parcel || undefined,
      clientId: data.clientId,
      notes: data.notes || undefined,
      status: "active",
      currency: "TRY",
    });
    // Standart hizmet kalemlerini otomatik ekle
    await createDefaultServiceItems(projectId);
    toast.success("Proje oluÅŸturuldu");
    setShowDialog(false);
    loadData();
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Projeler</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{projects.length} proje kayÄ±tlÄ±</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4" />
          Yeni Proje
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(["active", "on_hold", "completed", "draft"] as ProjectStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
            className={cn(
              "rounded-xl border p-4 text-left transition-all hover:shadow-sm",
              filterStatus === s ? "ring-2 ring-indigo-500" : "bg-white border-neutral-200"
            )}
          >
            <p className="text-2xl font-bold text-neutral-900">{statusCounts[s] || 0}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{PROJECT_STATUS_LABELS[s]}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Proje adÄ± ile ara..."
          className="pl-9"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
            <FolderOpen className="h-7 w-7 text-neutral-400" />
          </div>
          {projects.length === 0 ? (
            <>
              <p className="text-base font-medium text-neutral-700">HenÃ¼z proje eklenmedi</p>
              <p className="text-sm text-neutral-400 mt-1 mb-4">Ä°lk projeyi ekleyerek baÅŸlayÄ±n.</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4" />
                Ä°lk Projeyi Ekle
              </Button>
            </>
          ) : (
            <p className="text-base font-medium text-neutral-700">Arama sonucu bulunamadÄ±</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => {
            const client = getClient(project.clientId);
            return (
              <Link
                key={project.id}
                href={`/projeler/${project.id}`}
                className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-all block"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 shrink-0">
                  <FolderOpen className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-neutral-900 truncate">{project.title}</h3>
                    <Badge
                      className={cn("text-[10px] py-0 px-2", STATUS_COLORS[project.status])}
                      variant="outline"
                    >
                      {PROJECT_STATUS_LABELS[project.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    <span className="text-xs text-neutral-500">{PROJECT_TYPE_LABELS[project.type]}</span>
                    {client && (
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <User className="h-3 w-3" />
                        {client.name}
                      </span>
                    )}
                    {project.neighborhood && (
                      <span className="text-xs text-neutral-400">{project.neighborhood}</span>
                    )}
                    {project.contractAmount && (
                      <span className="flex items-center gap-1 text-xs font-medium text-neutral-700">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        {formatCurrency(project.contractAmount)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-xs font-medium text-indigo-600">Detay â†’</span>
              </Link>
            );
          })}
        </div>
      )}

      <ProjectDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onSave={handleCreateProject}
        persons={persons}
        categories={categories}
        onPersonAdded={(person) => setPersons((prev) => [...prev, person])}
      />
    </div>
  );
}
