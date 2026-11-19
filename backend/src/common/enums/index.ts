export enum RoleEnum {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  DELIVERY = 'DELIVERY',
}

export enum PaymentMethodEnum {
  CASH = 'CASH',                 // Efectivo físico
  TRANSFER = 'TRANSFER',         // Transferencia electrónica (Nequi, Daviplata, Bancolombia)
  CARD = 'CARD',                 // Tarjeta débito / crédito
  OTHER = 'OTHER',               // Otros medios
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
