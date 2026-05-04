import { useRequireRole } from '../../hooks/use-require-role';
import { ShippingForm } from '../sections/ShippingForm';

export default function ClientHomePanel() {
  const { me, loading } = useRequireRole('CLIENTE');
  if (loading || !me) return <p className="text-slate-600">Cargando…</p>;

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-ldh-navy">Hola, {me.fullName}</h1>
        <p className="text-slate-600">
          Gestiona tus envíos, consulta el seguimiento y localiza oficinas. Para enviar un paquete, usa el formulario de
          abajo: se guardará el borrador y continuarás en el asistente (servicio, datos y pago).
        </p>
        <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
          <li>
            <a className="font-semibold text-ldh-orange hover:underline" href="/cuenta/mis-envios">
              Ver historial y descargar facturas
            </a>
          </li>
          <li>
            <a className="font-semibold text-ldh-orange hover:underline" href="/cuenta/seguimiento">
              Rastrear con número LDH
            </a>
          </li>
          <li>
            <a className="font-semibold text-ldh-orange hover:underline" href="/cuenta/oficinas">
              Oficinas LDH
            </a>
          </li>
        </ul>
      </div>

      <section id="enviar" className="scroll-mt-8" aria-label="Nuevo envío desde tu cuenta">
        <h2 className="mb-4 text-lg font-bold text-ldh-navy">Preparar un envío</h2>
        <ShippingForm />
      </section>
    </div>
  );
}
