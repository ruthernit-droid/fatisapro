const fs = require("fs");
const p = "c:/fatisa pro/src/types/index.ts";
let c = fs.readFileSync(p, "utf8");

const INSERT = `
// --- OZALIT ISLERI ---
export type OzalitSize = "A0" | "A1" | "A2" | "A3" | "A4" | "other";
export type OzalitServiceType = "print" | "copy" | "scan" | "binding" | "laminate" | "other";

export interface OzalitJob {
  id: string;
  clientId?: string;
  clientName?: string;
  description: string;
  serviceType: OzalitServiceType;
  paperSize: OzalitSize;
  copies: number;
  unitPrice: number;
  totalAmount: number;
  isPaid: boolean;
  paidDate?: string;
  date: Date;
  notes?: string;
  syncToTransactions: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const OZALIT_SERVICE_LABELS: Record<OzalitServiceType, string> = {
  print: "Baski", copy: "Kopya", scan: "Tarama",
  binding: "Cilt", laminate: "Laminasyon", other: "Diger",
};

export const OZALIT_SIZE_LABELS: Record<OzalitSize, string> = {
  A0: "A0", A1: "A1", A2: "A2", A3: "A3", A4: "A4", other: "Diger",
};

// --- TUFAN OZEL ISLER ---
export type TufanTransactionType = "income" | "expense";
export type TufanTransactionCategory = "receivable" | "payable" | "payment" | "collection" | "other";

export interface TufanTransaction {
  id: string;
  personId?: string;
  personName?: string;
  type: TufanTransactionType;
  category: TufanTransactionCategory;
  amount: number;
  description: string;
  date: Date;
  dueDate?: Date;
  isPaid: boolean;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const TUFAN_CATEGORY_LABELS: Record<TufanTransactionCategory, string> = {
  receivable: "Alacak", payable: "Verecek", payment: "Yapilan Odeme",
  collection: "Tahsilat", other: "Diger",
};

`;

// Find insertion point: right after Quote interface ends, before AYARLAR comment
const insertMarker = "}\n\n// \u2500\u2500\u2500 AYARLAR";
const idx = c.indexOf(insertMarker);
if (idx === -1) {
  // Try alternative: just before CompanySettings
  const idx2 = c.indexOf("export interface CompanySettings");
  if (idx2 === -1) { console.error("Cannot find insertion point"); process.exit(1); }
  c = c.slice(0, idx2) + INSERT + c.slice(idx2);
} else {
  c = c.slice(0, idx + 2) + INSERT + c.slice(idx + 2);
}

fs.writeFileSync(p, c, "utf8");
console.log("types updated, size:", fs.statSync(p).size);
