"use client";

import { useState, useEffect } from "react";
import { CompanySettings } from "@/types";
import { getCompanySettings, saveCompanySettings } from "@/lib/firestore/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import toast from "react-hot-toast";
import { Building2 } from "lucide-react";

export function CompanySettingsForm() {
  const [form, setForm] = useState<Partial<CompanySettings>>({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    taxNumber: "",
    taxOffice: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCompanySettings().then((data) => {
      setForm(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast.error("Firma adı zorunludur");
      return;
    }
    setSaving(true);
    try {
      await saveCompanySettings(form);
      toast.success("Firma bilgileri kaydedildi");
    } catch {
      toast.error("Kayıt sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-neutral-400">
          Yükleniyor...
        </CardContent>
      </Card>
    );
  }

  const field = (
    id: keyof typeof form,
    label: string,
    placeholder?: string,
    type: string = "text"
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={(form[id] as string) || ""}
        onChange={(e) => setForm((p) => ({ ...p, [id]: e.target.value }))}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
            <Building2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle>Firma Bilgileri</CardTitle>
            <CardDescription className="mt-0.5">
              PDF çıktılarında ve tekliflerde gösterilecek firma bilgileri.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="name">
              Firma Adı <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={form.name || ""}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Fatisa Mimarlık"
            />
          </div>
          {field("phone", "Telefon", "0 (xxx) xxx xx xx")}
          {field("email", "E-posta", "info@firmam.com", "email")}
          {field("taxNumber", "Vergi No")}
          {field("taxOffice", "Vergi Dairesi")}
          {field("website", "Web Sitesi", "www.firmam.com")}
          <div className="sm:col-span-2">
            {field("address", "Adres", "Mahalle, Cadde, Şehir")}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
