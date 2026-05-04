import { useEffect, useState } from 'react';
import { homeForRole, login } from '../../lib/auth-client';
import { emailErrorMessage, isRealisticEmail } from '../../lib/validation/inputs';
import { authInputClass } from './authFieldStyles';

const REMEMBER_EMAIL_KEY = 'ldh_login_remember_email';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function validateFields(): boolean {
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
    return ok;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validateFields()) return;
    setLoading(true);
    try {
      if (remember) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
      const r = await login(email.trim(), password);
      window.location.href = homeForRole(r.role);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inicia sesión</h1>
      <p className="mt-3 text-sm text-slate-600">
        ¿Aún no tienes una cuenta?{' '}
        <a href="/registro" className="font-bold text-ldh-navy underline-offset-2 hover:text-ldh-orange hover:underline">
          REGÍSTRATE AQUÍ
        </a>
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5" noValidate>
        {formError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {formError}
          </div>
        ) : null}

        <div>
          <label htmlFor="login-email" className="sr-only">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="username"
            placeholder="Email*"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            onBlur={() => {
              if (!email.trim()) return;
              if (!isRealisticEmail(email)) setEmailError(emailErrorMessage(email));
              else setEmailError(null);
            }}
            className={authInputClass(!!emailError)}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'login-email-err' : undefined}
          />
          {emailError ? (
            <p id="login-email-err" className="mt-2 text-sm text-red-600">
              {emailError}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="login-password" className="sr-only">
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Contraseña*"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            className={authInputClass(!!passwordError)}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'login-password-err' : undefined}
          />
          {passwordError ? (
            <p id="login-password-err" className="mt-2 text-sm text-red-600">
              {passwordError}
            </p>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700 select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-400 text-ldh-navy accent-ldh-orange"
          />
          Recuérdame
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full border border-slate-400 bg-slate-100 py-3.5 text-sm font-bold tracking-[0.12em] text-slate-800 uppercase transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Entrando…' : 'INICIAR SESIÓN'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm">
        <a
          href="mailto:soporte@ldh.local?subject=Recuperar%20contraseña"
          className="font-medium text-ldh-navy underline-offset-2 hover:text-ldh-orange hover:underline"
        >
          ¿Has olvidado tu contraseña?
        </a>
      </p>

      <p className="mt-6 text-center text-xs text-slate-500">
        Administradores y repartidores acceden con cuenta creada por LDH.
      </p>
    </div>
  );
}
