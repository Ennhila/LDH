import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { fetchMe, login, register } from '../../lib/auth-client';
import {
  emailErrorMessage,
  isRealisticEmail,
  isSpainPostalCode,
  isStrongPassword,
  strongPasswordHint,
} from '../../lib/validation/inputs';
import { authInputClass } from '../auth/authFieldStyles';

type Tab = 'login' | 'register';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Tras login/registro válido como cliente. */
  onAuthSuccess: () => void | Promise<void>;
};

export function CheckoutAuthModal({ open, onClose, onAuthSuccess }: Props) {
  const [tab, setTab] = useState<Tab>('login');
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [postalError, setPostalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setFormError(null);
      setEmailError(null);
      setPasswordError(null);
      setFullNameError(null);
      setPostalError(null);
    }
  }, [open, tab]);

  if (!open) return null;

  async function ensureClienteAfterAuth() {
    const me = await fetchMe();
    if (me.role !== 'CLIENTE') {
      throw new Error(
        'Para finalizar un envío necesitas una cuenta de cliente. Esta cuenta es de otro tipo.',
      );
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setEmailError(null);
    setPasswordError(null);
    let ok = true;
    if (!email.trim()) {
      setEmailError('El email es obligatorio.');
      ok = false;
    } else if (!isRealisticEmail(email)) {
      setEmailError(emailErrorMessage(email) ?? 'Introduce un email válido.');
      ok = false;
    }
    if (!password) {
      setPasswordError('La contraseña es obligatoria.');
      ok = false;
    }
    if (!ok) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      await ensureClienteAfterAuth();
      await onAuthSuccess();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFullNameError(null);
    setEmailError(null);
    setPostalError(null);
    setPasswordError(null);
    let ok = true;
    if (!fullName.trim()) {
      setFullNameError('El nombre es obligatorio.');
      ok = false;
    }
    if (!email.trim()) {
      setEmailError('El email es obligatorio.');
      ok = false;
    } else if (!isRealisticEmail(email)) {
      setEmailError(emailErrorMessage(email) ?? 'Introduce un email válido.');
      ok = false;
    }
    if (!postalCode.trim()) {
      setPostalError('El código postal es obligatorio.');
      ok = false;
    } else if (!isSpainPostalCode(postalCode)) {
      setPostalError('CP español no válido.');
      ok = false;
    }
    if (!password) {
      setPasswordError('La contraseña es obligatoria.');
      ok = false;
    } else if (!isStrongPassword(password)) {
      setPasswordError(strongPasswordHint());
      ok = false;
    }
    if (!ok) return;

    setLoading(true);
    try {
      await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        postalCode: postalCode.trim().replace(/\D/g, '').slice(0, 5),
      });
      await ensureClienteAfterAuth();
      await onAuthSuccess();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-auth-title"
        className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 id="checkout-auth-title" className="text-lg font-extrabold text-ldh-navy">
            Accede para finalizar el envío
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <p className="text-sm text-slate-600">
            Inicia sesión o crea una cuenta de cliente para registrar el envío y descargar la factura y la etiqueta.
          </p>
          <div className="mt-4 flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
                tab === 'login' ? 'bg-white text-ldh-navy shadow-sm' : 'text-slate-600'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
                tab === 'register' ? 'bg-white text-ldh-navy shadow-sm' : 'text-slate-600'
              }`}
            >
              Registrarse
            </button>
          </div>
        </div>

        <div className="px-5 pb-6 pt-4">
          {formError ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {formError}
            </div>
          ) : null}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <label htmlFor="checkout-auth-email" className="mb-1 block text-xs font-semibold text-slate-700">
                  Email
                </label>
                <input
                  id="checkout-auth-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={authInputClass(!!emailError)}
                />
                {emailError ? <p className="mt-1 text-sm text-red-600">{emailError}</p> : null}
              </div>
              <div>
                <label htmlFor="checkout-auth-password" className="mb-1 block text-xs font-semibold text-slate-700">
                  Contraseña
                </label>
                <input
                  id="checkout-auth-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={authInputClass(!!passwordError)}
                />
                {passwordError ? <p className="mt-1 text-sm text-red-600">{passwordError}</p> : null}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-ldh-navy py-3 text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-ldh-navy-dark disabled:opacity-60"
              >
                {loading ? 'Entrando…' : 'Entrar y continuar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              <p className="text-xs text-slate-500">{strongPasswordHint()}</p>
              <div>
                <label htmlFor="checkout-auth-fullname" className="mb-1 block text-xs font-semibold text-slate-700">
                  Nombre completo
                </label>
                <input
                  id="checkout-auth-fullname"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={authInputClass(!!fullNameError)}
                />
                {fullNameError ? <p className="mt-1 text-sm text-red-600">{fullNameError}</p> : null}
              </div>
              <div>
                <label htmlFor="checkout-auth-reg-email" className="mb-1 block text-xs font-semibold text-slate-700">
                  Email
                </label>
                <input
                  id="checkout-auth-reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={authInputClass(!!emailError)}
                />
                {emailError ? <p className="mt-1 text-sm text-red-600">{emailError}</p> : null}
              </div>
              <div>
                <label htmlFor="checkout-auth-cp" className="mb-1 block text-xs font-semibold text-slate-700">
                  Código postal (España)
                </label>
                <input
                  id="checkout-auth-cp"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={8}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className={authInputClass(!!postalError)}
                />
                {postalError ? <p className="mt-1 text-sm text-red-600">{postalError}</p> : null}
              </div>
              <div>
                <label htmlFor="checkout-auth-reg-password" className="mb-1 block text-xs font-semibold text-slate-700">
                  Contraseña
                </label>
                <input
                  id="checkout-auth-reg-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={authInputClass(!!passwordError)}
                />
                {passwordError ? <p className="mt-1 text-sm text-red-600">{passwordError}</p> : null}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-ldh-orange py-3 text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-ldh-orange-hover disabled:opacity-60"
              >
                {loading ? 'Creando cuenta…' : 'Crear cuenta y continuar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
