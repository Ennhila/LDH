import type { DeliveryTypeCode } from '../../types/api';

/** Wizard draft: aligned with homepage form + future Spring Boot payload */
export type PackageTier = '2kg' | '5kg' | '10kg' | '20kg';

export type ShippingDraft = {
  originCountry: string;
  originPostalCode: string;
  destinationCountry: string;
  destinationPostalCode: string;
  packageTier: PackageTier;
};

export type PickupDeliveryType = 'Oficina' | 'Domicilio';

export type ShippingOption = {
  id: number;
  title: string;
  deliveryTime: string;
  pickup: PickupDeliveryType;
  delivery: PickupDeliveryType;
  /** Alineado con backend / modificadores de precio */
  deliveryTypeCode: DeliveryTypeCode;
  price: number;
  priceNoTax: number;
  features: string[];
  /** Matches “Entrega urgente” filter */
  urgent: boolean;
  /** Matches “Más filtros” (premium / value-added) */
  premium: boolean;
};

export type FilterId = 'urgent' | 'office_admission' | 'pickup_home' | 'delivery_office' | 'more';

export type RemitenteTipo = 'particular' | 'empresa';

/** Datos del remitente (paso 2); persistir hasta conectar API. */
export type RemitenteDraft = {
  tipo: RemitenteTipo;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  direccion: string;
  codigoPostal: string;
  pais: string;
  localidad: string;
  provincia: string;
  email: string;
  prefijo: string;
  telefono: string;
};

/** Oficina administrada (mock → GET /api/oficinas cuando exista backend). */
export type Oficina = {
  id: string;
  /** Código mostrado al usuario, ej. 2828194 */
  codigoPublico: string;
  calle: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
};

/** Destinatario (paso 3). */
export type DestinatarioDraft = {
  tipo: RemitenteTipo;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  email: string;
  prefijo: string;
  telefono: string;
  /** Búsqueda de oficinas por CP (modo oficina). */
  busquedaCpOficina: string;
  oficinaSeleccionada: Oficina | null;
  /** Modo domicilio: misma estructura que dirección de envío. */
  direccion: string;
  codigoPostal: string;
  pais: string;
  localidad: string;
  provincia: string;
};
