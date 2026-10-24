// Comprehensive TypeScript Definitions for Restaurant & Hotel Billing System

export interface ErrorMessage {
  errorCode: string;
  errorText: string;
  fieldName?: string;
  fieldValue?: string;
}

export interface Pagination {
  totalRecords?: number;
  maxPages?: number;
  currentPage?: number;
  pageSize?: number;
}

export interface DbExecutionResult {
  isSuccessful: boolean;
  resCode: string;
  resMsg: string;
  createdId?: string;
  pageInfo?: Pagination;
}

export interface ApiResponse<T = any> {
  isSuccessful: boolean;
  responseCode: number;
  resultMessage?: string;
  errorMessage?: ErrorMessage[];
  data?: {
    maxPages?: number;
    totalRecords?: number;
    createdId?: string;
    result?: T;
  } | T;
}

export interface User {
  userId: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'CASHIER' | 'MANAGER' | 'WAITER' | string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  username: string;
  fullName: string;
  role: string;
}

export interface Category {
  categoryId: string;
  categoryName: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  itemCount?: number;
}

export type FoodType = 'VEG' | 'NON_VEG' | 'BEVERAGE' | 'DESSERT';

export interface MenuItem {
  itemId: string;
  categoryId: string;
  categoryName?: string;
  itemCode?: string;
  itemName: string;
  description?: string;
  price: number;
  foodType: FoodType;
  taxRate?: number;
  isAvailable: boolean;
  isActive?: boolean;
}

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'BILLED' | 'RESERVED';

export interface RestaurantTable {
  tableId: string;
  tableNumber: string;
  seatingCapacity: number;
  locationArea: string;
  status: TableStatus;
  currentBillId?: string;
  billNumber?: string;
  grandTotal?: number;
  billCreatedAt?: string;
}

export interface BillItem {
  billItemId?: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  taxAmount?: number;
  totalPrice?: number;
  notes?: string;
}

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'SPLIT' | 'UNPAID';
export type BillStatus = 'ACTIVE' | 'SETTLED' | 'CANCELLED';
export type DiscountType = 'PERCENT' | 'FLAT' | 'NONE';

export interface Bill {
  billId: string;
  billNumber: string;
  orderType: OrderType;
  tableId?: string;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  subTotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  roundOff: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  billStatus: BillStatus;
  notes?: string;
  cashierId?: string;
  createdAt: string;
  settledAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  items?: BillItem[];
}

export interface BillCreatePayload {
  orderType: OrderType;
  tableId?: string | null;
  customerName?: string;
  customerPhone?: string | null;
  items: BillItem[];
  discountType: DiscountType;
  discountValue: number;
  notes?: string | null;
}

export interface BillSettlePayload {
  paymentMode: PaymentMode | string;
  amountPaid: number;
  notes?: string;
}

export interface DashboardMetrics {
  metricDate: string;
  todaySales: number;
  todayOrders: number;
  activeBills: number;
  occupiedTables: number;
  totalTables: number;
  occupancyRate: number;
  topSellingItems: Array<{
    itemName: string;
    totalQty: number;
    totalRevenue: number;
  }>;
  paymentBreakdown: Array<{
    paymentMode: string;
    count: number;
    amount: number;
  }>;
}

export interface SalesReport {
  fromDate: string;
  toDate: string;
  totalSales: number;
  totalOrders: number;
  totalTax: number;
  totalDiscount: number;
  dailyTrend: Array<{
    reportDate: string;
    ordersCount: number;
    subTotal: number;
    discount: number;
    tax: number;
    netRevenue: number;
  }>;
}

export interface ActivityLog {
  activityId: string;
  userId: string;
  username: string;
  activityType: string;
  module: string;
  description: string;
  recordId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  createdAt: string;
}

export type ThermalPaperWidth = '80mm' | '58mm';

export interface RestaurantSettings {
  restaurant_name: string;
  restaurant_tagline?: string;
  restaurant_address: string;
  restaurant_phone: string;
  restaurant_email?: string;
  restaurant_gstin?: string;
  fssai_license?: string;
  currency_symbol: string;
  currency_code: string;
  default_tax_rate: string | number;
  receipt_footer: string;
  receipt_paper_width: ThermalPaperWidth;
  [key: string]: any;
}
