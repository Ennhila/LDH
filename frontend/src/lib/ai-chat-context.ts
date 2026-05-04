import { API_BASE } from './api-base';
import { fetchActiveDeliveryTypes } from './public-pricing';

/**
 * Texto de contexto para el system prompt (precios/tipos de envío, oficinas, avisos).
 * Falla de red → contexto mínimo para no bloquear el chat.
 */
export async function buildAiChatContext(): Promise<string> {
  const lines: string[] = [
    'General: LDH ofrece envíos nacionales e internacionales, recogida/entrega en oficina o domicilio, y red de lockers 24/7.',
    'Seguimiento público: los usuarios pueden consultar el estado con el número de seguimiento en la web (sin cuenta).',
    'Contacto humano: contact@ldh.es',
  ];

  try {
    const types = await fetchActiveDeliveryTypes();
    if (types.length) {
      lines.push(
        'Tipos de entrega activos (código → etiqueta): ' +
          types.map((t) => `${t.code}: ${t.label}`).join('; ') +
          '.',
      );
    }
  } catch {
    lines.push('Tipos de entrega: OFFICE_OFFICE, OFFICE_HOME, HOME_OFFICE, HOME_HOME (detalle en la web).');
  }

  try {
    const res = await fetch(`${API_BASE}/api/public/oficinas`);
    if (res.ok) {
      const raw = await res.json();
      const n = Array.isArray(raw) ? raw.length : 0;
      lines.push(`Oficinas/puntos en la API pública: ${n} (mapa en /localiza-oficinas).`);
    }
  } catch {
    /* ignore */
  }

  lines.push(
    'Precios: dependen de zonas origen/destino (prefijos postales), peso, tipo de entrega y suplementos; el precio exacto sale en el flujo de cotización/checkout de la web.',
  );

  return lines.join('\n');
}
