"use client";

import { useState } from "react";
import Link from "next/link";
import { Person, PersonCategory } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials, formatPhone } from "@/lib/utils";
import { Pencil, Trash2, Phone, Mail, Building, ExternalLink } from "lucide-react";
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

interface PersonCardProps {
  person: Person;
  categories: PersonCategory[];
  onEdit: (person: Person) => void;
  onDelete: (id: string) => void;
}

export function PersonCard({
  person,
  categories,
  onEdit,
  onDelete,
}: PersonCardProps) {
  const personCategories = categories.filter((c) =>
    person.categoryIds.includes(c.id)
  );

  const initials = getInitials(person.name);
  const bgColors = [
    "#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6",
  ];
  const colorIndex =
    person.name.charCodeAt(0) % bgColors.length;
  const avatarColor = bgColors[colorIndex];

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Avatar */}
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full shrink-0 text-white font-semibold text-sm"
        style={{ backgroundColor: avatarColor }}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
            <Link
              href={`/kisiler/${person.id}`}
              className="text-sm font-semibold text-neutral-900 truncate hover:text-blue-600 transition-colors"
            >
              {person.name}
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              <Link href={`/kisiler/${person.id}`}>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:text-blue-600 hover:bg-blue-50">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(person)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kişiyi Sil</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{person.name}</strong> adlı kişiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(person.id)}>
                    Sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Categories */}
        {personCategories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {personCategories.map((cat) => (
              <Badge
                key={cat.id}
                variant="outline"
                className="text-[10px] py-0 px-2 border-transparent"
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

        {/* Contact info */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
            <Phone className="h-3 w-3 text-neutral-400 shrink-0" />
            <span>{formatPhone(person.phone)}</span>
          </div>
          {person.email && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
              <Mail className="h-3 w-3 text-neutral-400 shrink-0" />
              <span className="truncate">{person.email}</span>
            </div>
          )}
          {person.companyName && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
              <Building className="h-3 w-3 text-neutral-400 shrink-0" />
              <span className="truncate">{person.companyName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
