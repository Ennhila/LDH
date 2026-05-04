import { useEffect, useState } from 'react';
import { FileDown, Package } from 'lucide-react';
import { fetchClientCheckoutSnapshot } from '../../lib/client-checkout-snapshot';
import { getToken } from '../../lib/api';
import { downloadEtiquetaPdf } from '../../lib/pdf/etiqueta-pdf';
import { downloadFacturaPdf } from '../../lib/pdf/factura-pdf';
import {
  type OrderSnapshot,
  orderSnapshotFromServerPayload,
  persistCompletedOrderSnapshot,
  readCompletedOrderSnapshot,
} from '../../lib/pdf/order-snapshot';
import { WizardPageHeader } from './WizardPageHeader';

const REMOTE_FETCH_TIMEOUT_MS = 15000;

export function OrderSuccessPage() {
  const [snapshot, setSnapshot] = useState<OrderSnapshot | null>(() =>
    typeof window !== 'undefined' ? readCompletedOrderSnapshot() : null,
  );
  /** Debe ser false si ya tenemos snapshot local (session/localStorage); antes quedaba true y bloqueaba la UI */
  const [hydrating, setHydrating] = useState(() => {
    if (typeof window === 'undefined') return true;
    const s = readCompletedOrderSnapshot();
    return s == null;
  });
  const [remoteFailed, setRemoteFailed] = useState(false);
  const [busy, setBusy] = useState<'factura' | 'etiqueta' | null>(null);
  const [savedInAccount, setSavedInAccount] = useState(false);

  useEffect(() => {
    try {
      const api = sessionStorage.getItem('ldh_order_persisted_api') === '1';
      setSavedInAccount(api);
      sessionStorage.removeItem('ldh_order_persisted_api');
    } catch {
      setSavedInAccount(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (snapshot != null) {
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      const t = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('t') : null;
      if (!t || !getToken()) {
        if (!cancelled) {
          setRemoteFailed(false);
          setHydrating(false);
        }
        return;
      }

      const tn = decodeURIComponent(t);
      try {
        const r = await Promise.race([
          fetchClientCheckoutSnapshot(tn),
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error('timeout')), REMOTE_FETCH_TIMEOUT_MS),
          ),
        ]);
        const merged = orderSnapshotFromServerPayload(r.trackingNumber, r.createdAtIso, r.snapshotPayloadJson);
        if (!cancelled) {
          setSnapshot(merged);
          setRemoteFailed(!merged);
          if (merged) persistCompletedOrderSnapshot(merged);
        }
      } catch {
        if (!cancelled) {
          setSnapshot(null);
          setRemoteFailed(true);
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [snapshot]);

  const handleFactura = async () => {
    if (!snapshot) return;
    setBusy('factura');
    try {
      await downloadFacturaPdf(snapshot);
    } catch (e) {
      console.error(e);
      window.alert('No se pudo generar la factura PDF.');
    } finally {
      setBusy(null);
    }
  };

  const handleEtiqueta = async () => {
    if (!snapshot) return;
    setBusy('etiqueta');
    try {
      await downloadEtiquetaPdf(snapshot);
    } catch (e) {
      console.error(e);
      window.alert('No se pudo generar la etiqueta PDF.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex-1 bg-slate-50">
      <WizardPageHeader currentStep={4} subtitle={null} />

      <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:px-8">
        {hydrating ? (
          <p className="text-lg text-slate-600">Cargando datos del pedido…</p>
        ) : !snapshot ? (
          <>
            <p className="text-lg text-slate-700">No hay un pedido reciente para mostrar.</p>
            {typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('t') &&
            !getToken() ? (
              <p className="mt-3 text-sm text-slate-600">
                Hay un número de seguimiento en la URL, pero no hay sesión guardada en este navegador. Inicia sesión
                con tu cuenta de cliente y{' '}
                <a href={window.location.pathname + window.location.search} className="font-semibold text-ldh-orange underline">
                  recarga esta página
                </a>{' '}
                para cargar factura y etiqueta; o revisa{' '}
                <a href="/cuenta/mis-envios" className="font-semibold text-ldh-orange underline">
                  Mis envíos
                </a>
                .
              </p>
            ) : null}
            {remoteFailed ? (
              <p className="mt-3 text-sm text-slate-600">
                Si acabas de pagar, asegúrate de seguir con la misma sesión iniciada. También puedes revisar{' '}
                <a href="/cuenta/mis-envios" className="font-semibold text-ldh-orange underline">
                  Mis envíos
                </a>
                .
              </p>
            ) : null}
            <a href="/envio/paso-1" className="mt-4 inline-block font-bold text-ldh-orange underline">
              Iniciar un envío
            </a>
          </>
        ) : (
          <>
            <img
              src="/images/moscito.png"
              alt=""
              className="mx-auto h-40 w-auto object-contain sm:h-52"
              width={280}
              height={280}
            />
            <h1 className="mt-6 text-2xl font-extrabold text-emerald-700 sm:text-3xl">
              ¡Todo ha ido bien!
            </h1>
            <p className="mt-3 text-base text-slate-600">
              Tu envío <strong className="text-slate-900">{snapshot.trackingNumber}</strong> está registrado
              {savedInAccount ? (
                <>
                  {' '}
                  en tu cuenta LDH. También lo verás en{' '}
                  <a className="font-semibold text-ldh-orange underline" href="/cuenta/mis-envios">
                    Mis envíos
                  </a>
                  .
                </>
              ) : (
                <> en tu cuenta.</>
              )}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:mx-auto sm:max-w-md">
              <button
                type="button"
                disabled={busy !== null}
                onClick={handleFactura}
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-ldh-navy bg-white px-6 py-3 text-sm font-bold text-ldh-navy uppercase transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <FileDown className="h-5 w-5" aria-hidden />
                {busy === 'factura' ? 'Generando…' : 'Descargar factura PDF'}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={handleEtiqueta}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-ldh-orange px-6 py-3 text-sm font-bold text-white uppercase transition-colors hover:bg-ldh-orange-hover disabled:opacity-50"
              >
                <Package className="h-5 w-5" aria-hidden />
                {busy === 'etiqueta' ? 'Generando…' : 'Descargar etiqueta de envío'}
              </button>
            </div>

            <p className="mt-8 text-xs text-slate-500">
              La factura incluye el resumen del pedido y el logo LDH. La etiqueta incluye tracking, direcciones,
              código de barras y QR (demo).
            </p>

            <a
              href="/"
              className="mt-6 inline-block text-sm font-semibold text-ldh-navy underline hover:text-ldh-orange"
            >
              Volver al inicio
            </a>
          </>
        )}
      </div>
    </div>
  );
}
