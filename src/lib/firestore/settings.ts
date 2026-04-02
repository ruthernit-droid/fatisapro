import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CompanySettings } from "@/types";

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
