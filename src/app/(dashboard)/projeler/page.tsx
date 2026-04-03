"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Project,
  ProjectStatus,
  Person,
  PersonCategory,
  ProjectPaymentPlan,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  ProjectType,
} from "@/types";
import { getProjects, addProject } from "@/lib/firestore/projects";
import { getPersons } from "@/lib/firestore/persons";
import { createDefaultServiceItems } from "@/lib/firestore/projectServiceItems";
import { getAllPaymentPlans } from "@/lib/firestore/projectPaymentPlans";
import { useCategories } from "@/hooks/useCategories";
import { useProjectTypes } from "@/hooks/useProjectTypes";
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
  ChevronDown,
  ChevronUp,
  Clock,
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
  const [paymentPlans, setPaymentPlans] = useState<ProjectPaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "all">("all");
  const [showDialog, setShowDialog] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const { categories } = useCategories();
  const { projectTypes } = useProjectTypes();

  const loadData = useCallback(() => {
    Promise.all([getProjects(), getPersons(), getAllPaymentPlans()])
      .then(([p, pe, pp]) => {
        setProjects(p);
        setPersons(pe);
        setPaymentPlans(pp);
      })
      .catch(() => toast.error("Projeler yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function resolveProjectType(type: string): string {
    const pt = projectTypes.find((t) => t.id === type || t.name === type);
    if (pt) return pt.name;
    return PROJECT_TYPE_LABELS[type as ProjectType] || type;
  }

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
    type: string;
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
      status: "draft",
      currency: "TRY",
    });
    // Standart hizmet kalemlerini otomatik ekle
    await createDefaultServiceItems(projectId);
    toast.success("Proje oluşturuldu");
    setShowDialog(false);
    loadData();
  }

  const activeProjectIds = new Set(projects.filter((p) => p.status === "active").map((p) => p.id));
  const upcomingPayments = paymentPlans
    .filter((pp) => !pp.isPaid && activeProjectIds.has(pp.projectId))
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Projeler</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{projects.length} proje kayıtlı</p>
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

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden mb-6">
          <button
            onClick={() => setShowUpcoming((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">
                Yaklaşan Ödemeler
              </span>
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                {upcomingPayments.length}
              </span>
            </div>
            {showUpcoming ? <ChevronUp className="h-4 w-4 text-amber-600" /> : <ChevronDown className="h-4 w-4 text-amber-600" />}
          </button>
          {showUpcoming && (
            <div className="divide-y divide-amber-100">
              {upcomingPayments.slice(0, 10).map((pp) => {
                const proj = projects.find((p) => p.id === pp.projectId);
                return (
                  <div key={pp.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-100/60">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-800 truncate">{pp.title}</p>
                      {proj && (
                        <Link href={`/projeler/${proj.id}`} className="text-xs text-indigo-600 hover:underline truncate block">
                          {proj.title}
                        </Link>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-neutral-900">{formatCurrency(pp.amount)}</p>
                      {pp.dueDate && (
                        <p className="text-[10px] text-neutral-500">
                          {new Date(pp.dueDate).toLocaleDateString("tr-TR")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {upcomingPayments.length > 10 && (
                <p className="text-xs text-center text-neutral-500 py-2">+{upcomingPayments.length - 10} daha...</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Proje adı ile ara..."
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
              <p className="text-base font-medium text-neutral-700">Henüz proje eklenmedi</p>
              <p className="text-sm text-neutral-400 mt-1 mb-4">İlk projeyi ekleyerek başlayın.</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4" />
                İlk Projeyi Ekle
              </Button>
            </>
          ) : (
            <p className="text-base font-medium text-neutral-700">Arama sonucu bulunamadı</p>
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
                    <span className="text-xs text-neutral-500">{resolveProjectType(project.type)}</span>
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
        projectTypes={projectTypes}
        onPersonAdded={(person) => setPersons((prev) => [...prev, person])}
      />
    </div>
  );
}
