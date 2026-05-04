import type { Envio, EnvioStatus } from '../../types/api';

const statusLabel: Record<EnvioStatus, string> = {
  PENDING: 'Pendiente',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En tránsito',
  OUT_FOR_DELIVERY: 'En reparto',
  DELIVERED: 'Entregado',
  EXCEPTION: 'Incidencia',
};

const QUICK_STATUSES: EnvioStatus[] = [
  'PENDING',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'EXCEPTION',
];

type Props = {
  envio: Envio;
  busy: boolean;
  onClose: () => void;
  /** Estados rápidos excepto incidencia si quieres modal largo */
  onPickStatus: (status: EnvioStatus) => void;
};

export function RepartidorScanSheet({ envio, busy, onClose, onPickStatus }: Props) {
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[85] bg-black/40 backdrop-blur-[1px]"
        aria-label="Cerrar panel"
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-[90] max-h-[85vh] animate-[sheet-up_0.28s_ease-out] rounded-t-2xl border border-slate-200 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-sheet-title"
      >
        <div className="mx-auto flex max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-2">
          <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-slate-300" aria-hidden />
          <h2 id="scan-sheet-title" className="text-lg font-bold text-ldh-navy">
            Envío encontrado
          </h2>
          <p className="font-mono text-sm font-semibold text-slate-800">{envio.trackingNumber}</p>
          <p className="mt-1 text-xs text-slate-500">
            Estado actual: <strong className="text-slate-700">{statusLabel[envio.status]}</strong>
          </p>

          <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm">
            {envio.destinationAddress ? (
              <p>
                <span className="font-medium text-slate-600">Destino:</span>{' '}
                <span className="text-slate-800">{envio.destinationAddress}</span>
              </p>
            ) : null}
            {envio.destinationPostalCode ? (
              <p className="text-xs text-slate-600">CP: {envio.destinationPostalCode}</p>
            ) : null}
            {envio.recipientName ? (
              <p>
                <span className="font-medium text-slate-600">Destinatario:</span> {envio.recipientName}
              </p>
            ) : null}
            {envio.clientEmail ? (
              <p className="text-xs text-slate-500">Cliente: {envio.clientEmail}</p>
            ) : null}
          </div>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cambiar estado
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {QUICK_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy || envio.status === s}
                onClick={() => onPickStatus(s)}
                className={`rounded-xl border px-3 py-3 text-center text-xs font-semibold transition focus:ring-2 focus:ring-ldh-navy/30 focus:outline-none disabled:opacity-40 ${
                  s === 'DELIVERED'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                    : s === 'EXCEPTION'
                      ? 'border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100'
                      : 'border-slate-200 bg-slate-50 text-ldh-navy hover:bg-slate-100'
                }`}
              >
                {statusLabel[s]}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={busy}
            className="mt-4 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
      <style>{`
        @keyframes sheet-up {
          from { transform: translateY(100%); opacity: 0.85; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
