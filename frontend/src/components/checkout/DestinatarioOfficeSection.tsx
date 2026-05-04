import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Oficina } from '../../lib/shipping-wizard/types';
import {
  filtrarOficinasPorCp,
  formatOficinaDireccion,
  formatOficinaLabel,
} from '../../lib/shipping-wizard/mock-oficinas';
import { fetchPublicOficinasForWizard } from '../../lib/shipping-wizard/oficinas-api';

const field =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-ldh-orange focus:ring-2 focus:ring-ldh-orange/25 focus:outline-none';

type Props = {
  busquedaCp: string;
  onBusquedaCpChange: (v: string) => void;
  seleccionada: Oficina | null;
  onSeleccionar: (o: Oficina) => void;
  onQuitarSeleccion: () => void;
};

export function DestinatarioOfficeSection({
  busquedaCp,
  onBusquedaCpChange,
  seleccionada,
  onSeleccionar,
  onQuitarSeleccion,
}: Props) {
  const [catalog, setCatalog] = useState<Oficina[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchPublicOficinasForWizard();
        if (!cancelled) setCatalog(list);
      } catch {
        if (!cancelled) setLoadError('No se pudieron cargar las oficinas. ¿Está el servidor en marcha?');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const candidatas = filtrarOficinasPorCp(catalog, busquedaCp);
  const digits = busquedaCp.replace(/\D/g, '');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <span
            className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-ldh-orange bg-white"
            aria-hidden
          >
            <span className="h-2 w-2 rounded-full bg-ldh-navy" />
          </span>
          Oficina
        </span>
      </div>

      <p className="text-sm text-slate-600">Introduce tu código postal para ver oficinas LDH disponibles.</p>

      {loadError && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {loadError}
        </p>
      )}

      <input
        type="text"
        inputMode="numeric"
        className={field}
        placeholder="Código postal"
        value={busquedaCp}
        onChange={(e) => onBusquedaCpChange(e.target.value)}
        autoComplete="postal-code"
        disabled={loading && catalog.length === 0}
      />

      {loading && catalog.length === 0 ? (
        <p className="text-sm text-slate-500">Cargando oficinas…</p>
      ) : null}

      {!loading && catalog.length === 0 && !loadError ? (
        <p className="text-sm text-slate-500">
          Aún no hay oficinas en el sistema. Un administrador puede añadirlas desde el panel.
        </p>
      ) : null}

      {seleccionada ? (
        <div className="flex items-stretch gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <img
            src="/images/oficina.png"
            alt=""
            className="h-10 w-10 shrink-0 self-center object-contain opacity-80"
            width={40}
            height={40}
          />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-ldh-navy">{formatOficinaLabel(seleccionada)}</p>
            <p className="mt-1 text-xs leading-snug text-slate-500 uppercase">
              {formatOficinaDireccion(seleccionada)}
            </p>
          </div>
          <button
            type="button"
            onClick={onQuitarSeleccion}
            className="shrink-0 self-center rounded-lg p-2 text-ldh-navy transition-colors hover:bg-slate-100"
            aria-label="Quitar oficina"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      ) : (
        digits.length > 0 &&
        candidatas.length > 0 && (
          <ul className="space-y-2">
            {candidatas.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onSeleccionar(o)}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-ldh-orange/50 hover:bg-orange-50/30"
                >
                  <img
                    src="/images/oficina.png"
                    alt=""
                    className="h-9 w-9 shrink-0 object-contain opacity-80"
                    width={36}
                    height={36}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{formatOficinaLabel(o)}</p>
                    <p className="text-xs text-slate-500 uppercase">{formatOficinaDireccion(o)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )
      )}

      {digits.length >= 5 && candidatas.length === 0 && !seleccionada && !loading && catalog.length > 0 ? (
        <p className="text-sm text-slate-500">
          No hay oficinas con ese código postal. Prueba otro CP o revisa las oficinas dadas de alta en administración.
        </p>
      ) : null}
    </div>
  );
}
