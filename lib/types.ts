// ============================================
// ENUMS
// ============================================

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
}

export enum PaymentType {
  ADVANCE = 'ADVANCE',
  DURING = 'DURING',
  FINAL = 'FINAL',
}

export enum ExpenseCategory {
  OFFICE = 'OFFICE',
  SITE_VISIT = 'SITE_VISIT',
  PARTY_VISIT = 'PARTY_VISIT',
  OTHER = 'OTHER',
  ALL_EXPENSES = 'ALL_EXPENSES',
}

export enum PendingWorkStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

// ============================================
// MODEL TYPES
// ============================================

export type User = {
  id: string;
  email: string;
  password: string;
  name: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Worker = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  dailyRate: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Site = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AttendanceRecord = {
  id: string;
  workerId: string;
  siteId: string;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  status: AttendanceStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MaterialRecord = {
  id: string;
  siteId: string;
  materialName: string;
  quantity: number;
  unit: string;
  date: Date;
  cost: number | null;
  supplierName: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DispatchRecord = {
  id: string;
  fromSiteId: string;
  toSiteId: string;
  materialName: string;
  quantity: number;
  unit: string;
  dispatchDate: Date;
  receivedDate: Date | null;
  isReceived: boolean;
  dispatchedBy: string | null;
  receivedBy: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkUpdate = {
  id: string;
  siteId: string;
  date: Date;
  description: string;
  photoUrl: string | null;
  videoUrl: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Overtime = {
  id: string;
  workerId: string;
  siteId: string;
  date: Date;
  extraHours: number;
  rate: number;
  totalAmount: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Payment = {
  id: string;
  clientName: string;
  paymentType: PaymentType;
  amount: number;
  paymentDate: Date;
  documentUrl: string | null;
  projectName: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Expense = {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: Date;
  billUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PendingWork = {
  id: string;
  siteId: string;
  taskDescription: string;
  reasonForPending: string;
  expectedCompletionDate: Date | null;
  actualCompletionDate: Date | null;
  status: PendingWorkStatus;
  priority: string | null;
  assignedTo: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================
// API RESPONSE TYPES
// ============================================

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// ============================================
// FORM INPUT TYPES
// ============================================

export type WorkerInput = {
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  dailyRate?: number;
  isActive?: boolean;
};

export type SiteInput = {
  name: string;
  location?: string;
  description?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
};

export type AttendanceInput = {
  workerId: string;
  siteId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  notes?: string;
};

export type MaterialInput = {
  siteId: string;
  materialName: string;
  quantity: number;
  unit: string;
  date: string;
  cost?: number;
  supplierName?: string;
  notes?: string;
};

export type DispatchInput = {
  fromSiteId: string;
  toSiteId: string;
  materialName: string;
  quantity: number;
  unit: string;
  dispatchDate: string;
  receivedDate?: string;
  isReceived?: boolean;
  dispatchedBy?: string;
  receivedBy?: string;
  notes?: string;
};

export type WorkUpdateInput = {
  siteId: string;
  date: string;
  description: string;
  photoUrl?: string;
  videoUrl?: string;
  createdBy?: string;
};

export type OvertimeInput = {
  workerId: string;
  siteId: string;
  date: string;
  extraHours: number;
  rate: number;
  notes?: string;
};

export type PaymentInput = {
  clientName: string;
  paymentType: PaymentType;
  amount: number;
  paymentDate: string;
  documentUrl?: string;
  projectName?: string;
  notes?: string;
};

export type ExpenseInput = {
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string;
  billUrl?: string;
  notes?: string;
};

export type PendingWorkInput = {
  siteId: string;
  taskDescription: string;
  reasonForPending: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  status?: PendingWorkStatus;
  priority?: string;
  assignedTo?: string;
  notes?: string;
};

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export type AttendanceWithRelations = AttendanceRecord & {
  worker: Worker;
  site: Site;
};

export type MaterialWithRelations = MaterialRecord & {
  site: Site;
};

export type DispatchWithRelations = DispatchRecord & {
  fromSite: Site;
  toSite: Site;
};

export type WorkUpdateWithRelations = WorkUpdate & {
  site: Site;
};

export type OvertimeWithRelations = Overtime & {
  worker: Worker;
  site: Site;
};

export type PendingWorkWithRelations = PendingWork & {
  site: Site;
};
