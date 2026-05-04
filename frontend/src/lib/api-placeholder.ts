/**
 * Placeholders for future Spring Boot integration.
 * Replace fetch URLs and types when the backend is ready.
 */

export type TrackShipmentResult = {
  trackingNumber: string;
  status: string;
  events: { date: string; description: string }[];
};

/** @deprecated Connect to GET /api/shipments/{trackingNumber} */
export async function fetchShipmentStatus(_trackingNumber: string): Promise<TrackShipmentResult> {
  throw new Error('Backend not connected yet');
}

export type QuoteRequest = {
  originCountry: string;
  originPostalCode: string;
  destinationCountry: string;
  destinationPostalCode: string;
  packageTier: '2kg' | '5kg' | '10kg' | '20kg';
};

/** @deprecated Connect to POST /api/quotes */
export async function requestShippingQuote(_body: QuoteRequest): Promise<{ priceEur: number }> {
  throw new Error('Backend not connected yet');
}
