"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Person,
  PersonCategory,
  Project,
  ProjectServiceItem,
  ProjectPaymentPlan,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
} from "@/types";
import { getPerson } from "@/lib/firestore/persons";
import { getProjects } from "@/lib/firestore/projects";
import { getServiceItems } from "@/lib/firestore/projectServiceItems";
import { getPaymentPlans } from "@/lib/firestore/projectPaymentPlans";
import { getPersons } from "@/lib/firestore/persons";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, getInitials, formatPhone } from "@/lib/utils";
import toast from "react-hot-toast";
import { ArrowLeft, Phone, Mail, Building, FolderOpen } from "lucide-react";
import { PersonDialog } from "@/components/persons/PersonDialog";
import { updatePerson } from "@/lib/firestore/persons";

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const personId = params.id as string;

  const [person, setPerson] = useState<Person | null>(null);
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // (İşveren olduğu projeler için ödeme planları)
  const [paymentPlansByProject, setPaymentPlansByProject] = useState<
    Record<string, ProjectPaymentPlan[]>
  >({});

  // (Müellif olduğu hizmet kalemleri)
  const [serviceItemsByProject, setServiceItemsByProject] = useState<
    Record<string, ProjectServiceItem[]>
  >({});

  const { categories } = useCategories();
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [p, allProj, prs] = await Promise.all([
        getPerson(personId),
        getProjects(),
        getPersons(),
      ]);
      if (!p) { router.push("/kisiler"); return; }
      setPerson(p);
      setAllPersons(prs);

      // İşveren olduğu projeler
      const clientProjects = allProj.filter((pr) => pr.clientId === personId);

      // Müellif olduğu hizmet kalemleri (tüm projelerden)
      const allServiceItems: ProjectServiceItem[] = [];
      const uniqueProjectIds = new Set(allProj.map((pr) => pr.id));

      const [allPaymentPlans, allItems] = await Promise.all([
        Promise.all(
          clientProjects.map((pr) =>
            getPaymentPlans(pr.id).then((plans) => ({ projectId: pr.id, plans }))
          )
        ),
        Promise.all(
          Array.from(uniqueProjectIds).map((pid) =>
            getServiceItems(pid).then((items) => ({ projectId: pid, items }))
          )
        ),
      ]);

      const ppByProj: Record<string, ProjectPaymentPlan[]> = {};
      allPaymentPlans.forEach(({ projectId, plans }) => {
        ppByProj[projectId] = plans;
      });
      setPaymentPlansByProject(ppByProj);

      const siByProj: Record<string, ProjectServiceItem[]> = {};
      const muellifItems: ProjectServiceItem[] = [];
      allItems.forEach(({ projectId, items }) => {
        const filtered = items.filter((i) => i.muellif === personId);
        if (filtered.length > 0) {
          siByProj[projectId] = filtered;
          muellifItems.push(...filtered);
        }
      });
      setServiceItemsByProject(siByProj);

      // Ilgili tüm projeleri (hem işveren hem müellif olarak) topla
      const muellifProjectIds = new Set(Object.keys(siByProj));
      const relatedProjects = allProj.filter(
        (pr) => pr.clientId === personId || muellifProjectIds.has(pr.id)
      );
      setProjects(relatedProjects);
    } catch (err) {
      toast.error("Kişi bilgileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [personId, router]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Kişiyi düzenle ──────────────────────────────────────────────────────
  async function handleUpdatePerson(data: Omit<Person, "id" | "createdAt" | "updatedAt">) {
    await updatePerson(personId, data);
    toast.success("Kişi güncellendi");
    setShowEditDialog(false);
    await loadAll();
  }

  // ── Finansal özet hesabı ────────────────────────────────────────────────
  const clientProjects = projects.filter((p) => p.clientId === personId);
  const muellifProjects = projects.filter((p) => serviceItemsByProject[p.id]?.length > 0);

  // İşveren olarak: toplam sözleşme, tahsil edilen, bakiye
  const asClientTotal = clientProjects.reduce((s, p) => s + (p.contractAmount || 0), 0);
  const asClientReceived = clientProjects.reduce((s, p) => {
    const plans = paymentPlansByProject[p.id] || [];
    return s + plans.filter((pl) => pl.isPaid).reduce((ps, pl) => ps + pl.paidAmount, 0);
  }, 0);
  const asClientOutstanding = asClientTotal - asClientReceived;

  // Müellif olarak: toplam borç, ödenen, kalan
  const asMuелліfTotal = Object.values(serviceItemsByProject)
    .flat()
    .reduce((s, i) => s + (i.cost || 0), 0);
  const asMuелліfPaid = Object.values(serviceItemsByProject)
    .flat()
    .reduce((s, i) => {
      return s + i.paymentInstallments.filter((p) => p.isPaid).reduce((ps, p) => ps + p.amount, 0);
    }, 0);
  const asMuелліfRemaining = asMuелліfTotal - asMuелліfPaid;

  const getProjPerson = (id?: string) => id ? allPersons.find((p) => p.id === id) : undefined;

  const bgColors = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6"];
  const avatarColor = person ? bgColors[person.name.charCodeAt(0) % bgColors.length] : "#6366f1";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!person) return null;

  const personCategories = categories.filter((c) => person.categoryIds.includes(c.id));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Üst bar */}
      <div className="flex items-center gap-3">
        <Link href="/kisiler">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-neutral-900">Kişi Detayı</h1>
      </div>

      {/* Kişi bilgi kartı */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full shrink-0 text-white font-bold text-lg"
            style={{ backgroundColor: avatarColor }}
          >
            {getInitials(person.name)}
          </div>

          {/* Bilgiler */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">{person.name}</h2>
                {person.companyName && (
                  <p className="text-sm text-neutral-500 flex items-center gap-1 mt-0.5">
                    <Building className="h-3.5 w-3.5" /> {person.companyName}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                Düzenle
              </Button>
            </div>

            {/* Kategoriler */}
            {personCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {personCategories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant="outline"
                    className="text-[10px] py-0 px-2"
                    style={{
                      backgroundColor: cat.color + "22",
                      color: cat.color,
                      borderColor: cat.color + "44",
                    }}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* İletişim */}
            <div className="flex flex-wrap gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                <Phone className="h-3.5 w-3.5 text-neutral-400" />
                {formatPhone(person.phone)}
              </span>
              {person.email && (
                <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                  <Mail className="h-3.5 w-3.5 text-neutral-400" />
                  {person.email}
                </span>
              )}
            </div>
            {person.notes && (
              <p className="mt-3 text-sm text-neutral-500 italic">{person.notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Finansal özet kartları */}
      {(asClientTotal > 0 || asMuелліfTotal > 0) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500 mb-1">İşveren — Toplam Proje</p>
            <p className="text-xl font-bold text-neutral-900">{formatCurrency(asClientTotal)}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500 mb-1">İşveren — Tahsil Edilen</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(asClientReceived)}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500 mb-1">Müellif — Sözleşme Bedeli</p>
            <p className="text-xl font-bold text-neutral-900">{formatCurrency(asMuелліfTotal)}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500 mb-1">Müellif — Ödenmesi Gereken</p>
            <p className={cn("text-xl font-bold", asMuелліfRemaining > 0 ? "text-orange-500" : "text-green-600")}>
              {formatCurrency(asMuелліfRemaining)}
            </p>
          </div>
        </div>
      )}

      {/* İşveren olduğu projeler */}
      {clientProjects.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">
              İşveren Olduğu Projeler ({clientProjects.length})
            </h2>
          </div>
          <div className="divide-y divide-neutral-50">
            {clientProjects.map((proj) => {
              const plans = paymentPlansByProject[proj.id] || [];
              const received = plans.filter((p) => p.isPaid).reduce((s, p) => s + p.paidAmount, 0);
              const outstanding = (proj.contractAmount || 0) - received;
              return (
                <div key={proj.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 shrink-0">
                    <FolderOpen className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/projeler/${proj.id}`}
                      className="text-sm font-medium text-neutral-800 hover:text-indigo-600 truncate block"
                    >
                      {proj.title}
                    </Link>
                    <p className="text-xs text-neutral-500">{PROJECT_TYPE_LABELS[proj.type]}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {proj.contractAmount ? (
                      <p className="text-sm font-medium">{formatCurrency(proj.contractAmount)}</p>
                    ) : null}
                    {outstanding > 0 ? (
                      <p className="text-xs text-red-500">{formatCurrency(outstanding)} alacak</p>
                    ) : proj.contractAmount ? (
                      <p className="text-xs text-green-600">Tahsil edildi</p>
                    ) : null}
                  </div>
                  <Badge
                    className="text-[10px] shrink-0"
                    variant="outline"
                  >
                    {PROJECT_STATUS_LABELS[proj.status]}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Müellif olduğu hizmet kalemleri */}
      {muellifProjects.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">
              Müellif Olduğu Hizmetler
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left px-4 py-2 text-xs text-neutral-500">Proje</th>
                  <th className="text-left px-4 py-2 text-xs text-neutral-500">Hizmet</th>
                  <th className="text-right px-4 py-2 text-xs text-neutral-500">Maliyet</th>
                  <th className="text-right px-4 py-2 text-xs text-neutral-500">Ödenen</th>
                  <th className="text-right px-4 py-2 text-xs text-neutral-500">Kalan</th>
                </tr>
              </thead>
              <tbody>
                {muellifProjects.flatMap((proj) =>
                  (serviceItemsByProject[proj.id] || []).map((item) => {
                    const paid = item.paymentInstallments
                      .filter((i) => i.isPaid)
                      .reduce((s, i) => s + i.amount, 0);
                    return (
                      <tr key={item.id} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                        <td className="px-4 py-2">
                          <Link
                            href={`/projeler/${proj.id}`}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            {proj.title}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-xs font-medium text-neutral-800">{item.serviceName}</td>
                        <td className="px-4 py-2 text-right text-xs">{formatCurrency(item.cost)}</td>
                        <td className="px-4 py-2 text-right text-xs text-green-600">{formatCurrency(paid)}</td>
                        <td className="px-4 py-2 text-right text-xs">
                          <span className={item.cost - paid > 0 ? "text-orange-500 font-medium" : "text-green-600"}>
                            {formatCurrency(item.cost - paid)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-50 border-t border-neutral-200">
                  <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-neutral-700">TOPLAM</td>
                  <td className="px-4 py-2 text-right text-xs font-bold">{formatCurrency(asMuелліfTotal)}</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-green-600">{formatCurrency(asMuелліfPaid)}</td>
                  <td className="px-4 py-2 text-right text-xs font-bold text-orange-500">{formatCurrency(asMuелліfRemaining)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Proje yok */}
      {clientProjects.length === 0 && muellifProjects.length === 0 && (
        <div className="bg-white rounded-xl border border-neutral-100 px-4 py-10 text-center">
          <p className="text-sm text-neutral-400">Bu kişiye ait proje veya hizmet kaydı bulunamadı.</p>
        </div>
      )}

      {/* Düzenleme dialog */}
      <PersonDialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSave={handleUpdatePerson}
        person={person}
        categories={categories}
      />
    </div>
  );
}
