export interface PersonCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Person {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  companyName?: string;
  notes?: string;
  /** Bir kiÅŸi aynÄ± anda birden fazla role sahip olabilir */
  categoryIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// â”€â”€â”€ PROJE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type ProjectStatus =
  | "draft"       // Taslak
  | "active"      // Aktif
  | "on_hold"     // Beklemede
  | "completed"   // TamamlandÄ±
  | "archived"    // ArÅŸivlendi
  | "cancelled";  // Ä°ptal

export type ProjectType =
  | "architectural_project"
  | "static_project"
  | "electrical_project"
  | "mechanical_project"
  | "permit_application"
  | "site_supervision"
  | "consultation"
  | "other";

export interface Project {
  id: string;
  title: string;
  projectNo?: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  clientId: string;           // Ana iÅŸveren/mÃ¼ÅŸteri kiÅŸi ID
  neighborhood?: string;      // Mahalle
  parcel?: string;            // Ada / Parsel bilgisi
  address?: string;
  /** Paket fiyat: iÅŸverene sunulan toplam proje bedeli */
  contractAmount?: number;
  currency: "TRY";
  startDate?: Date;
  deadlineDate?: Date;
  completedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// â”€â”€â”€ HÄ°ZMET KALEMÄ° (Proje iÃ§indeki satÄ±r) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type ServiceItemStatus =
  | "not_started"          // BaÅŸlamadÄ±
  | "site_review"          // YapÄ± Denetim Ä°ncelemesinde
  | "revision_pending"     // Revize Bekliyor
  | "municipality_review"  // Belediye Ä°ncelemesinde
  | "approved";            // OnaylandÄ±

/** Tekil Ã¶deme taksiti (hem mÃ¼ellife Ã¶denen hem mÃ¼ÅŸteriden alÄ±nan iÃ§in) */
export interface PaymentInstallment {
  id: string;
  amount: number;
  dueDate?: string;    // "YYYY-MM-DD" ISO string
  paidDate?: string;   // "YYYY-MM-DD" ISO string
  isPaid: boolean;
  notes?: string;
}

/** Bir projedeki bir hizmet kalemi */
export interface ProjectServiceItem {
  id: string;
  projectId: string;
  serviceName: string;          // "Mimari", "Statik", "EKB" vb.
  muellif?: string;             // KiÅŸi ID - hizmeti alacaÄŸÄ±mÄ±z kiÅŸi
  cost: number;                 // MÃ¼ellife Ã¶denecek maliyet
  plannedPaymentDate?: string;  // Planlanan Ã¶deme gÃ¼nÃ¼
  actualPaymentDate?: string;   // GerÃ§ekleÅŸen Ã¶deme gÃ¼nÃ¼
  paymentInstallments: PaymentInstallment[]; // ParÃ§a parÃ§a Ã¶demeler
  status: ServiceItemStatus;
  notes?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Ä°ÅŸverenin bize yapacaÄŸÄ± Ã¶deme planÄ± */
/** Ek harcama: isverenin adina yapilan, isverene yansitilacak gider */
export interface ProjectExpense {
  id: string;
  projectId: string;
  description: string;
  cost: number;
  chargeToClient: number;
  isPaid: boolean;
  paidDate?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectPaymentPlan {
  id: string;
  projectId: string;
  title: string;       // "Avans", "1. Ã–deme" vb.
  amount: number;      // Planlanan tutar
  dueDate?: string;    // Vade tarihi
  paidAmount: number;  // GerÃ§ekleÅŸen Ã¶deme
  paidDate?: string;   // GerÃ§ekleÅŸen tarih
  isPaid: boolean;
  notes?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// â”€â”€â”€ GÃ–REV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedPersonId?: string;
  dueDate?: Date;
  completedDate?: Date;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// â”€â”€â”€ FÄ°NANSAL Ä°ÅLEMLER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type TransactionType = "income" | "expense";

export type TransactionCategory =
  | "project_fee"
  | "consultation_fee"
  | "permit_fee"
  | "product_sale"
  | "other_income"
  | "subcontractor"
  | "material"
  | "office_expense"
  | "tax"
  | "salary"
  | "other_expense";

export interface Transaction {
  id: string;
  projectId?: string;
  personId?: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: Date;
  invoiceNo?: string;
  isPaid: boolean;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// â”€â”€â”€ TEKLÄ°F â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface Quote {
  id: string;
  projectId?: string;
  personId: string;
  quoteNo: string;
  title: string;
  items: QuoteItem[];
  subtotal: number;
  grandTotal: number;
  currency: "TRY";
  status: QuoteStatus;
  validUntil?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// â”€â”€â”€ AYARLAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

export interface CompanySettings {
  name: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxNumber?: string;
  taxOffice?: string;
  iban?: string;
  bankName?: string;
  updatedAt: Date;
}

export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

// â”€â”€â”€ LABEL MAPS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Taslak",
  active: "Aktif",
  on_hold: "Beklemede",
  completed: "TamamlandÄ±",
  archived: "ArÅŸivlendi",
  cancelled: "Ä°ptal",
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  architectural_project: "Mimari Proje",
  static_project: "Statik Proje",
  electrical_project: "Elektrik Projesi",
  mechanical_project: "Mekanik Proje",
  permit_application: "Ruhsat BaÅŸvurusu",
  site_supervision: "Åantiye Denetimi",
  consultation: "DanÄ±ÅŸmanlÄ±k",
  other: "DiÄŸer",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "YapÄ±lacak",
  in_progress: "Devam Ediyor",
  done: "TamamlandÄ±",
  cancelled: "Ä°ptal",
};

export const SERVICE_ITEM_STATUS_LABELS: Record<ServiceItemStatus, string> = {
  not_started: "BaÅŸlamadÄ±",
  site_review: "YapÄ± Denetim Ä°ncelemesinde",
  revision_pending: "Revize Bekliyor",
  municipality_review: "Belediye Ä°ncelemesinde",
  approved: "OnaylandÄ±",
};

export const SERVICE_ITEM_STATUS_COLORS: Record<ServiceItemStatus, string> = {
  not_started:         "bg-neutral-100 text-neutral-600 border-neutral-200",
  site_review:         "bg-blue-100 text-blue-700 border-blue-200",
  revision_pending:    "bg-orange-100 text-orange-700 border-orange-200",
  municipality_review: "bg-purple-100 text-purple-700 border-purple-200",
  approved:            "bg-green-100 text-green-700 border-green-200",
};

export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  project_fee: "Proje Bedeli",
  consultation_fee: "DanÄ±ÅŸmanlÄ±k Ãœcreti",
  permit_fee: "Ruhsat Ãœcreti",
  product_sale: "Mal/ÃœrÃ¼n SatÄ±ÅŸÄ±",
  other_income: "DiÄŸer Gelir",
  subcontractor: "Alt YÃ¼klenici Ã–demesi",
  material: "Malzeme AlÄ±mÄ±",
  office_expense: "Ofis Gideri",
  tax: "Vergi",
  salary: "MaaÅŸ",
  other_expense: "DiÄŸer Gider",
};

/** Standarart olarak her yeni projede oluÅŸturulacak hizmet kalemleri */
export const DEFAULT_SERVICE_NAMES = [
  "Jeoloji",
  "Mimari",
  "Statik",
  "Mekanik",
  "Elektrik",
  "Harita",
  "EKB",
  "Akustik",
  "3D GÃ¶rselleÅŸtirme",
  "Ã‡Ä±ktÄ±",
  "DiÄŸer",
] as const;
