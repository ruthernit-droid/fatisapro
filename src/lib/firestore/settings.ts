import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CompanySettings, AppSettings } from "@/types";

const SETTINGS_DOC = "app/settings";

const DEFAULT_COMPANY: CompanySettings = {
  name: "Fatisa Mimarlık",
  updatedAt: new Date(),
};

export async function getCompanySettings(): Promise<CompanySettings> {
  const snap = await getDoc(doc(db, SETTINGS_DOC));
  if (!snap.exists()) return DEFAULT_COMPANY;
  const data = snap.data();
  return {
    name: (data.name as string) || DEFAULT_COMPANY.name,
    logoUrl: data.logoUrl as string | undefined,
    address: data.address as string | undefined,
    phone: data.phone as string | undefined,
    email: data.email as string | undefined,
    website: data.website as string | undefined,
    taxNumber: data.taxNumber as string | undefined,
    taxOffice: data.taxOffice as string | undefined,
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function saveCompanySettings(
  data: Partial<Omit<CompanySettings, "updatedAt">>
): Promise<void> {
  await setDoc(
    doc(db, SETTINGS_DOC),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

const APP_SETTINGS_DOC = "app/appSettings";

const DEFAULT_APP_SETTINGS: AppSettings = {
  kdvEnabled: false,
  kdvRate: 20,
  showCostInQuotes: false,
  incomeCategories: ["Proje Geliri", "Danışmanlık Ücreti", "İzin Ücreti", "Ürün Satışı", "Diğer Gelir"],
  expenseCategories: ["Alt Yüklenici", "Malzeme", "Ofis Gideri", "Vergi", "Maaş", "Yakıt", "Diğer Gider"],
  updatedAt: new Date(),
};

export async function getAppSettings(): Promise<AppSettings> {
  const snap = await getDoc(doc(db, APP_SETTINGS_DOC));
  if (!snap.exists()) return DEFAULT_APP_SETTINGS;
  const data = snap.data();
  return {
    kdvEnabled: (data.kdvEnabled as boolean) ?? false,
    kdvRate: (data.kdvRate as number) ?? 20,
    showCostInQuotes: (data.showCostInQuotes as boolean) ?? false,
    incomeCategories: (data.incomeCategories as string[]) ?? DEFAULT_APP_SETTINGS.incomeCategories,
    expenseCategories: (data.expenseCategories as string[]) ?? DEFAULT_APP_SETTINGS.expenseCategories,
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  };
}

export async function saveAppSettings(
  data: Partial<Omit<AppSettings, "updatedAt">>
): Promise<void> {
  await setDoc(
    doc(db, APP_SETTINGS_DOC),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
