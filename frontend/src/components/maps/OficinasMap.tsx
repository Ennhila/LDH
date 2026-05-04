import { useEffect, useRef } from 'react';
import type { Oficina } from '../../types/api';
import 'leaflet/dist/leaflet.css';

type Props = {
  oficinas: Oficina[];
  height?: string;
};

export default function OficinasMap({ oficinas, height = '420px' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let map: import('leaflet').Map | null = null;
    let cancelled = false;

    (async () => {
      const L = await import('leaflet');
      if (cancelled || !el) return;

      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      map = L.map(el).setView([40.4168, -3.7038], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      const withCoords = oficinas.filter((o) => o.latitude != null && o.longitude != null);
      for (const o of withCoords) {
        L.marker([o.latitude as number, o.longitude as number], { icon })
          .addTo(map)
          .bindPopup(`<strong>${o.name}</strong><br/>${o.addressLine}, ${o.postalCode} ${o.city}`);
      }
      if (withCoords.length === 1) {
        map.setView([withCoords[0].latitude as number, withCoords[0].longitude as number], 14);
      } else if (withCoords.length > 1) {
        const bounds = L.latLngBounds(
          withCoords.map((o) => [o.latitude as number, o.longitude as number] as [number, number]),
        );
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [oficinas]);

  return <div ref={ref} className="z-0 w-full rounded-lg border border-slate-200" style={{ height }} />;
}
