/**
 * Shipping wizard — shared types, draft persistence, and static catalog.
 * Wire these to Spring Boot by replacing persistence with API calls.
 */

export type {
  DestinatarioDraft,
  FilterId,
  Oficina,
  PackageTier,
  PickupDeliveryType,
  RemitenteDraft,
  ShippingDraft,
  ShippingOption,
} from './types';
export {
  DRAFT_STORAGE_KEY,
  draftToQueryString,
  formatSummaryAddress,
  getPackageSummaryLines,
  persistShippingDraft,
  readShippingDraftFromWindow,
} from './draft';
export { FILTER_BUTTONS, WIZARD_STEPS } from './constants';
export {
  SHIPPING_OPTIONS,
  filterShippingOptions,
  getShippingOptionById,
  optionMatchesFilters,
} from './shippingOptions';
export {
  REMITENTE_STORAGE_KEY,
  persistRemitenteDraft,
  readRemitenteDraft,
} from './remitente-storage';
export {
  DESTINATARIO_STORAGE_KEY,
  persistDestinatarioDraft,
  readDestinatarioDraft,
} from './destinatario-storage';
export {
  MOCK_OFICINAS,
  buscarOficinasPorCp,
  filtrarOficinasPorCp,
  formatOficinaDireccion,
  formatOficinaLabel,
} from './mock-oficinas';
export { fetchPublicOficinasForWizard, mapApiOficinaToWizard } from './oficinas-api';
export { PACKAGE_SPECS } from './packageSpecs';
