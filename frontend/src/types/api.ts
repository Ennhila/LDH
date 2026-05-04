export type Role = 'ADMIN' | 'REPARTIDOR' | 'CLIENTE';

export type EnvioStatus =
  | 'PENDING'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'EXCEPTION';

export type AuthResponse = {
  token: string;
  email: string;
  role: Role;
  fullName: string;
};

export type UserMe = {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  postalCode: string | null;
  phone: string | null;
  shiftActive: boolean;
};

export type DashboardStats = {
  repartidoresTotal: number;
  repartidoresActivos: number;
  oficinasTotal: number;
  envios: { last7Days: number; last30Days: number; last90Days: number };
  ingresosCents: { last7Days: number; last30Days: number; last90Days: number };
};

export type Oficina = {
  id: number;
  name: string;
  addressLine: string;
  postalCode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

export type Repartidor = {
  id: number;
  email: string;
  fullName: string;
  postalCode: string | null;
  phone: string | null;
  enabled: boolean;
  shiftActive: boolean;
};

export type DeliveryTypeCode = 'OFFICE_OFFICE' | 'OFFICE_HOME' | 'HOME_OFFICE' | 'HOME_HOME';

export type ShippingZoneDto = {
  id: number;
  code: string;
  name: string;
  international: boolean;
  displayOrder: number;
  flagEmoji: string | null;
  prefixes: { id: number; prefix: string }[];
  activeMatrixRuleCount: number;
};

export type PriceMatrixCellDto = {
  id: number;
  originZoneId: number;
  originZoneCode: string;
  destZoneId: number;
  destZoneCode: string;
  basePrice: number;
  pricePerKgOver1: number;
  pricePerKgOver5: number;
  pricePerKgOver20: number;
  fuelSurcharge: number;
  remoteAreaSurcharge: number;
  validFrom: string | null;
  validTo: string | null;
  active: boolean;
};

export type DeliveryModifierDto = {
  id: number;
  code: DeliveryTypeCode;
  label: string;
  multiplier: number;
  flatSurcharge: number;
  active: boolean;
};

/** Respuesta de GET /api/public/pricing/delivery-types (solo tipos activos). */
export type PublicDeliveryTypeDto = {
  code: DeliveryTypeCode;
  label: string;
};

export type PricingQuoteResponse = {
  originZoneId: number;
  originZoneCode: string;
  originZoneName: string;
  destZoneId: number;
  destZoneCode: string;
  destZoneName: string;
  deliveryTypeCode: string;
  baseComponent: number;
  weightComponent: number;
  fuelSurcharge: number;
  remoteAreaSurcharge: number;
  deliveryMultiplier: number;
  deliveryFlatSurcharge: number;
  totalEur: number;
};

/** GET /api/client/envios/by-tracking/.../checkout-snapshot */
export type ClientCheckoutSnapshotResponse = {
  trackingNumber: string;
  createdAtIso: string;
  snapshotPayloadJson: string;
};

export type Envio = {
  id: number;
  trackingNumber: string;
  status: EnvioStatus;
  originAddress: string | null;
  originPostalCode: string | null;
  destinationAddress: string | null;
  destinationPostalCode: string | null;
  packageWeightKg: number | null;
  packageLengthCm: number | null;
  packageWidthCm: number | null;
  packageHeightCm: number | null;
  senderName: string | null;
  senderPhone: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  totalAmountCents: number | null;
  currency: string | null;
  notes: string | null;
  currentLatitude: number | null;
  currentLongitude: number | null;
  lastLocationLabel: string | null;
  clientEmail: string | null;
  assignedRepartidorId: number | null;
  createdAt: string;
  updatedAt: string;
  exceptionReason: string | null;
  exceptionNotes: string | null;
};

/** GET /api/admin/envios/{id}/audit */
export type EnvioStatusAuditEntry = {
  id: number;
  oldStatus: EnvioStatus | null;
  newStatus: EnvioStatus;
  changedAt: string;
  actorUserId: number | null;
  actorEmail: string | null;
  notes: string | null;
};

/** GET /api/admin/dashboard/charts */
export type AdminDashboardCharts = {
  enviosCreatedByDay: { date: string; count: number }[];
  enviosByStatus: { status: string; count: number }[];
  ingresosDeliveredByDay: { date: string; amountCents: number }[];
};
