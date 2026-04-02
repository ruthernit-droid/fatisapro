"use client";

import { useState, useEffect } from "react";
import { Task, TaskStatus, TaskPriority, TASK_STATUS_LABELS } from "@/types";
import { getTasks, updateTask, deleteTask } from "@/lib/firestore/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Plus, Search, Check, Circle, Clock, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
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

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  todo:        <Circle className="h-4 w-4 text-neutral-400" />,
  in_progress: <Clock className="h-4 w-4 text-blue-500" />,
  done:        <Check className="h-4 w-4 text-green-500" />,
  cancelled:   <AlertCircle className="h-4 w-4 text-red-400" />,
};

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  low:    "bg-neutral-100 text-neutral-500 border-neutral-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high:   "bg-red-100 text-red-600 border-red-200",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Düşük", medium: "Orta", high: "Yüksek",
};

export default function GorevlerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");

  const load = async () => {
    setLoading(true);
    try {
      setTasks(await getTasks());
    } catch {
      toast.error("Görevler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = tasks.filter((t) => {
    const matchSearch = !search.trim() || t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    await updateTask(task.id, {
      status,
      completedDate: status === "done" ? new Date() : undefined,
    });
    await load();
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    toast.success("Görev silindi");
    await load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Görevler</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{tasks.filter(t => t.status !== "done").length} açık görev</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Yeni Görev
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(["all", "todo", "in_progress", "done"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
              filterStatus === s
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
            )}
          >
            {s === "all" ? "Tümü" : TASK_STATUS_LABELS[s]}
            {s !== "all" && (
              <span className="ml-1.5 text-[10px] opacity-60">
                ({tasks.filter((t) => t.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Görev ara..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
            <CheckSquare className="h-7 w-7 text-neutral-400" />
          </div>
          <p className="text-base font-medium text-neutral-700">
            {tasks.length === 0 ? "Henüz görev eklenmedi" : "Görev bulunamadı"}
          </p>
          {tasks.length === 0 && (
            <Button className="mt-4"><Plus className="h-4 w-4" />İlk Görevi Ekle</Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm transition-all",
                task.status === "done" ? "opacity-60" : "hover:shadow-md"
              )}
            >
              {/* Status toggle */}
              <button
                onClick={() =>
                  handleStatusChange(
                    task,
                    task.status === "done" ? "todo" : task.status === "todo" ? "in_progress" : "done"
                  )
                }
                className="shrink-0"
              >
                {STATUS_ICONS[task.status]}
              </button>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium text-neutral-800",
                  task.status === "done" && "line-through text-neutral-400"
                )}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">{task.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] py-0 px-1.5", PRIORITY_BADGE[task.priority])}
                  >
                    {PRIORITY_LABELS[task.priority]}
                  </Badge>
                  {task.dueDate && (
                    <span className={cn(
                      "text-[10px] text-neutral-400",
                      new Date(task.dueDate) < new Date() && task.status !== "done" && "text-red-500 font-medium"
                    )}>
                      {new Date(task.dueDate).toLocaleDateString("tr-TR")}
                    </span>
                  )}
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Görevi Sil</AlertDialogTitle>
                    <AlertDialogDescription>Bu görevi silmek istediğinizden emin misiniz?</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(task.id)}>Sil</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
