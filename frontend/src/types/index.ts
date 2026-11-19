export enum RoleEnum {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  DELIVERY = 'DELIVERY',
}

export enum PaymentMethodEnum {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  CARD = 'CARD',
  OTHER = 'OTHER',
}

export enum SaleStatusEnum {
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING',
}

export enum DeliveryStatusEnum {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum InventoryMovementTypeEnum {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  SALE = 'SALE',
}

export enum CashRegisterStatusEnum {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: RoleEnum;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  products?: Product[];
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  categoryId: string;
  category?: Category;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  product?: Product;
  type: InventoryMovementTypeEnum;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceId?: string;
  userId?: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  total: number;
}

export interface Payment {
  id: string;
  saleId: string;
  method: PaymentMethodEnum;
  amount: number;
  referenceCode?: string;
  notes?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  totalCost: number;
  status: SaleStatusEnum;
  customerName?: string;
  customerDocument?: string;
  customerPhone?: string;
  userId: string;
  notes?: string;
  isDelivery: boolean;
  items: SaleItem[];
  payments: Payment[];
  createdAt: string;
}

export interface CashMovement {
  id: string;
  cashRegisterId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  paymentMethod: PaymentMethodEnum;
  referenceId?: string;
  userId: string;
  createdAt: string;
}

export interface CashRegister {
  id: string;
  status: CashRegisterStatusEnum;
  openingDate: string;
  closingDate?: string;
  openingBalance: number;
  cashSales: number;
  transferSales: number;
  cardSales: number;
  cashExpenses: number;
  cashIncomes: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  openedByUserId: string;
  closedByUserId?: string;
  notes?: string;
  movements?: CashMovement[];
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethodEnum;
  receiptUrl?: string;
  responsibleUserId: string;
  responsibleName: string;
  date: string;
  notes?: string;
}

export interface DeliveryOrder {
  id: string;
  saleId: string;
  sale?: Sale;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryNeighborhood?: string;
  deliveryNotes?: string;
  deliveryFee: number;
  status: DeliveryStatusEnum;
  driverId?: string;
  driverName?: string;
  estimatedMinutes: number;
  dispatchedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface FinancialReport {
  totalRevenue: number;
  totalCostOfGoodsSold: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  netMarginPercentage: number;
  salesCount: number;
  expensesCount: number;
  paymentMethods: Record<string, number>;
  chartData: {
    date: string;
    ingresos: number;
    costos: number;
    gastos: number;
    utilidadNeta: number;
  }[];
}
