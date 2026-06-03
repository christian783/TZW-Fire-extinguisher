export type Role = "ADMIN" | "INSPECTOR" | "USER";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  emailVerified?: boolean;
  exp?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ExtinguisherType = "WATER" | "CO2" | "FOAM" | "DRY_CHEMICAL";
export type ExtinguisherSize = "2.5 lb" | "5 lb" | "9 lb" | "12 lb";
export type ExtinguisherStatus = "ACTIVE" | "DUE_FOR_INSPECTION" | "MAINTENANCE_REQUIRED" | "EXPIRED" | "RETIRED";

export type FireExtinguisher = {
  id: string;
  serialNumber: string;
  location: string;
  type: ExtinguisherType;
  size: ExtinguisherSize;
  installationDate: string;
  expiryDate: string;
  status: ExtinguisherStatus;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type InspectionStatus = "SCHEDULED" | "COMPLETED" | "OVERDUE" | "CANCELLED";
export type InspectionResult = "PASS" | "FAIL" | "NEEDS_MAINTENANCE";

export type Inspection = {
  id: string;
  extinguisherId: string;
  extinguisher?: FireExtinguisher;
  scheduledDate: string;
  scheduledTime: string;
  status: InspectionStatus;
  result?: InspectionResult | null;
  findings?: string | null;
  recommendations?: string | null;
  inspectorId?: string | null;
  inspector?: Pick<User, "id" | "firstName" | "lastName" | "email" | "role"> | null;
  requestedById: string;
  requestedBy?: Pick<User, "id" | "firstName" | "lastName" | "email" | "role">;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type MaintenanceLog = {
  id: string;
  extinguisherId: string;
  extinguisher?: FireExtinguisher;
  inspectorId: string;
  inspector?: Pick<User, "id" | "firstName" | "lastName" | "email" | "role">;
  actionTaken: string;
  maintenanceDate: string;
  issuesIdentified?: string | null;
  recommendations?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DashboardReport = {
  inventory: {
    totalExtinguishers: number;
    dailyInventorySummary: number;
    monthlyInventorySummary: number;
    yearlyInventorySummary: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  };
  inspections: {
    pendingInspections: number;
    completedInspections: number;
    overdueInspections: number;
  };
  compliance: {
    expiredExtinguishers: number;
    upcomingExpirations: FireExtinguisher[];
    complianceStatus: {
      compliant: number;
      total: number;
      percentage: number;
    };
  };
  maintenance: {
    maintenanceHistory: number;
    maintenanceFrequency: number;
    recentMaintenanceActivities: MaintenanceLog[];
  };
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  total: number;
  page: number;
  totalPages: number;
};

export type AuthResponse = {
  user: User;
  token: string;
};

export type OtpResponse = {
  userId: string;
  email: string;
  expiresAt: string;
  devOtp?: string;
};
