import type { FilterId, ShippingOption } from './types';

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 1,
    title: 'LDH oficina — oficina',
    deliveryTime: '48-72h',
    pickup: 'Oficina',
    delivery: 'Oficina',
    deliveryTypeCode: 'OFFICE_OFFICE',
    price: 5.8,
    priceNoTax: 4.79,
    features: ['Incluye LDH Modify', 'Impuestos incluidos'],
    urgent: false,
    premium: false,
  },
  {
    id: 2,
    title: 'LDH domicilio — domicilio',
    deliveryTime: '48-72h',
    pickup: 'Domicilio',
    delivery: 'Domicilio',
    deliveryTypeCode: 'HOME_HOME',
    price: 9.2,
    priceNoTax: 7.6,
    features: ['Incluye LDH Modify', 'Recogida acordada', 'Impuestos incluidos'],
    urgent: false,
    premium: false,
  },
  {
    id: 3,
    title: 'LDH oficina — domicilio',
    deliveryTime: '24-48h',
    pickup: 'Oficina',
    delivery: 'Domicilio',
    deliveryTypeCode: 'OFFICE_HOME',
    price: 6.9,
    priceNoTax: 5.7,
    features: ['Incluye LDH Modify', 'Entrega a domicilio', 'Impuestos incluidos'],
    urgent: true,
    premium: false,
  },
  {
    id: 4,
    title: 'LDH domicilio — oficina',
    deliveryTime: '24-48h',
    pickup: 'Domicilio',
    delivery: 'Oficina',
    deliveryTypeCode: 'HOME_OFFICE',
    price: 7.4,
    priceNoTax: 6.12,
    features: ['Incluye LDH Modify', 'Entrega en locker/oficina', 'Impuestos incluidos'],
    urgent: true,
    premium: false,
  },
  {
    id: 5,
    title: 'LDH Premium domicilio — domicilio',
    deliveryTime: '24h',
    pickup: 'Domicilio',
    delivery: 'Domicilio',
    deliveryTypeCode: 'HOME_HOME',
    price: 14.5,
    priceNoTax: 11.98,
    features: ['Ventana horaria preferente', 'LDH Modify ampliado', 'Impuestos incluidos'],
    urgent: true,
    premium: true,
  },
];

export function optionMatchesFilters(option: ShippingOption, active: Set<FilterId>): boolean {
  if (active.size === 0) return true;
  for (const f of active) {
    if (f === 'urgent' && !option.urgent) return false;
    if (f === 'office_admission' && option.pickup !== 'Oficina') return false;
    if (f === 'pickup_home' && option.pickup !== 'Domicilio') return false;
    if (f === 'delivery_office' && option.delivery !== 'Oficina') return false;
    if (f === 'more' && !option.premium) return false;
  }
  return true;
}

export function filterShippingOptions(
  options: ShippingOption[],
  active: Set<FilterId>,
): ShippingOption[] {
  return options.filter((o) => optionMatchesFilters(o, active));
}

export function getShippingOptionById(id: number): ShippingOption | undefined {
  return SHIPPING_OPTIONS.find((o) => o.id === id);
}

/** Solo opciones cuyo tipo de entrega está activo en administración. */
export function filterOptionsByActiveDeliveryTypes(
  options: ShippingOption[],
  activeCodes: Set<string>,
): ShippingOption[] {
  if (activeCodes.size === 0) return [];
  return options.filter((o) => activeCodes.has(o.deliveryTypeCode));
}
