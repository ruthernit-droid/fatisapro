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

/** Proje türleri — ayarlar sayfasından yönetilir */
export interface ProjectTypeItem {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Proje hizmet kalemleri için ana kategori + alt kategoriler */
export interface ServiceCategory {
  id: string;
  name: string;            // Ana kategori adı, ör. "Statik"
  subcategories: string[]; // Alt kategori adları, ör. ["Kalıp İskele", "Betonarme"]
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
  /** Bir kişi aynı anda birden fazla role sahip olabilir */
  categoryIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// --- PROJE -------------------------------------------------------------------
export type ProjectStatus =
  | "draft"       // Taslak
  | "active"      // Aktif
  | "on_hold"     // Beklemede
  | "completed"   // Tamamlandı
  | "archived"    // Arşivlendi
  | "cancelled";  // İptal

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
  type: string;   // stored as free string; display resolved from projectTypes or PROJECT_TYPE_LABELS
  status: ProjectStatus;
  clientId: string;
  neighborhood?: string;
  parcel?: string;
  address?: string;
  contractAmount?: number;
  currency: "TRY";
  startDate?: Date;
  deadlineDate?: Date;
  completedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- HİZMET KALEMİ -----------------------------------------------------------
export type ServiceItemStatus =
  | "not_started"
  | "site_review"
  | "revision_pending"
  | "municipality_review"
  | "approved";

export interface PaymentInstallment {
  id: string;
  amount: number;
  dueDate?: string;
  paidDate?: string;
  isPaid: boolean;
  notes?: string;
}

export interface ProjectServiceItem {
  id: string;
  projectId: string;
  serviceName: string;
  muellif?: string;
  cost: number;
  plannedPaymentDate?: string;
  actualPaymentDate?: string;
  paymentInstallments: PaymentInstallment[];
  status: ServiceItemStatus;
  notes?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectPaymentPlan {
  id: string;
  projectId: string;
  title: string;
  amount: number;
  dueDate?: string;
  paidAmount: number;
  paidDate?: string;
  isPaid: boolean;
  notes?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

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

// --- GÖREV -------------------------------------------------------------------
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

// --- FİNANSAL İŞLEMLER -------------------------------------------------------
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

// --- TEKLİF ------------------------------------------------------------------
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

// --- AYARLAR -----------------------------------------------------------------
export interface AppSettings {
  kdvEnabled: boolean;       // KDV hesaplamaları aktif mi (varsayılan: false)
  kdvRate: number;           // KDV oranı % (varsayılan: 20)
  showCostInQuotes: boolean; // Tekliflerde birim maliyet göster (varsayılan: false)
  updatedAt: Date;
}

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

// --- OZALİT İŞLERİ -----------------------------------------------------------
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
  print: "Baskı", copy: "Kopya", scan: "Tarama",
  binding: "Cilt", laminate: "Laminasyon", other: "Diğer",
};

export const OZALIT_SIZE_LABELS: Record<OzalitSize, string> = {
  A0: "A0", A1: "A1", A2: "A2", A3: "A3", A4: "A4", other: "Diğer",
};

// --- TUFAN ÖZEL İŞLER --------------------------------------------------------
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
  receivable: "Alacak", payable: "Verecek", payment: "Yapılan Ödeme",
  collection: "Tahsilat", other: "Diğer",
};

// --- LABEL MAPS --------------------------------------------------------------
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft:     "Taslak",
  active:    "Aktif",
  on_hold:   "Beklemede",
  completed: "Tamamlandı",
  archived:  "Arşivlendi",
  cancelled: "İptal",
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  architectural_project: "Mimari Proje",
  static_project:        "Statik Proje",
  electrical_project:    "Elektrik Projesi",
  mechanical_project:    "Mekanik Proje",
  permit_application:    "Ruhsat Başvurusu",
  site_supervision:      "Şantiye Denetimi",
  consultation:          "Danışmanlık",
  other:                 "Diğer",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo:        "Yapılacak",
  in_progress: "Devam Ediyor",
  done:        "Tamamlandı",
  cancelled:   "İptal",
};

export const SERVICE_ITEM_STATUS_LABELS: Record<ServiceItemStatus, string> = {
  not_started:         "Başlamadı",
  site_review:         "Yapı Denetim İncelemesinde",
  revision_pending:    "Revize Bekliyor",
  municipality_review: "Belediye İncelemesinde",
  approved:            "Onaylandı",
};

export const SERVICE_ITEM_STATUS_COLORS: Record<ServiceItemStatus, string> = {
  not_started:         "bg-neutral-100 text-neutral-600 border-neutral-200",
  site_review:         "bg-blue-100 text-blue-700 border-blue-200",
  revision_pending:    "bg-orange-100 text-orange-700 border-orange-200",
  municipality_review: "bg-purple-100 text-purple-700 border-purple-200",
  approved:            "bg-green-100 text-green-700 border-green-200",
};

export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  project_fee:      "Proje Bedeli",
  consultation_fee: "Danışmanlık Ücreti",
  permit_fee:       "Ruhsat Ücreti",
  product_sale:     "Mal/Ürün Satışı",
  other_income:     "Diğer Gelir",
  subcontractor:    "Alt Yüklenici Ödemesi",
  material:         "Malzeme Alımı",
  office_expense:   "Ofis Gideri",
  tax:              "Vergi",
  salary:           "Maaş",
  other_expense:    "Diğer Gider",
};

/** Standart olarak her yeni projede oluşturulacak hizmet kalemleri */
export const DEFAULT_SERVICE_NAMES = [
  "Jeoloji",
  "Mimari",
  "Statik",
  "Mekanik",
  "Elektrik",
  "Harita",
  "EKB",
  "Akustik",
  "3D Görselleştirme",
  "Çıktı",
  "Diğer",
] as const;