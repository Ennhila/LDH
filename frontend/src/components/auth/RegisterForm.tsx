import { useState } from 'react';
import { homeForRole, register } from '../../lib/auth-client';
import {
  emailErrorMessage,
  isRealisticEmail,
  isStrongPassword,
  isSpainPostalCode,
  strongPasswordHint,
} from '../../lib/validation/inputs';
import { authInputClass } from './authFieldStyles';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [postalError, setPostalError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateFields(): boolean {
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
      setPostalError(
        'CP español no válido (01–52 o Canarias 35/38; no valores ficticios como 22222).',
      );
      ok = false;
    }
    if (!password) {
      setPasswordError('La contraseña es obligatoria.');
      ok = false;
    } else if (!isStrongPassword(password)) {
      setPasswordError(strongPasswordHint());
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
      const r = await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        postalCode: postalCode.trim().replace(/\D/g, '').slice(0, 5),
      });
      window.location.href = homeForRole(r.role);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Crear cuenta</h1>
      <p className="mt-3 text-sm text-slate-600">
        ¿Ya tienes cuenta?{' '}
        <a href="/login" className="font-bold text-ldh-navy underline-offset-2 hover:text-ldh-orange hover:underline">
          INICIA SESIÓN AQUÍ
        </a>
      </p>
      <p className="mt-2 text-xs text-slate-500">{strongPasswordHint()} CP solo España (registro).</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        {formError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {formError}
          </div>
        ) : null}

        <div>
          <label htmlFor="reg-fullName" className="sr-only">
            Nombre completo
          </label>
          <input
            id="reg-fullName"
            name="fullName"
            autoComplete="name"
            placeholder="Nombre completo*"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fullNameError) setFullNameError(null);
            }}
            className={authInputClass(!!fullNameError)}
            aria-invalid={!!fullNameError}
            aria-describedby={fullNameError ? 'reg-fullName-err' : undefined}
          />
          {fullNameError ? (
            <p id="reg-fullName-err" className="mt-2 text-sm text-red-600">
              {fullNameError}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="reg-email" className="sr-only">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            name="email"
            autoComplete="email"
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
            aria-describedby={emailError ? 'reg-email-err' : undefined}
          />
          {emailError ? (
            <p id="reg-email-err" className="mt-2 text-sm text-red-600">
              {emailError}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="reg-cp" className="sr-only">
            Código postal
          </label>
          <input
            id="reg-cp"
            name="postalCode"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={8}
            placeholder="Código postal (España)*"
            title="Ej: 28001, 35001"
            value={postalCode}
            onChange={(e) => {
              setPostalCode(e.target.value);
              if (postalError) setPostalError(null);
            }}
            className={authInputClass(!!postalError)}
            aria-invalid={!!postalError}
            aria-describedby={postalError ? 'reg-cp-err' : undefined}
          />
          {postalError ? (
            <p id="reg-cp-err" className="mt-2 text-sm text-red-600">
              {postalError}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="reg-password" className="sr-only">
            Contraseña
          </label>
          <input
            id="reg-password"
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            placeholder="Contraseña*"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            className={authInputClass(!!passwordError)}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? 'reg-password-err' : undefined}
          />
          {passwordError ? (
            <p id="reg-password-err" className="mt-2 text-sm text-red-600">
              {passwordError}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full border border-slate-400 bg-slate-100 py-3.5 text-sm font-bold tracking-[0.12em] text-slate-800 uppercase transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creando cuenta…' : 'CREAR CUENTA'}
        </button>
      </form>
    </div>
  );
}
