import { useEffect, useState, type FormEvent } from 'react'

import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../lib/auth-types'
import { defaultRouteForRole } from '../../lib/auth-session'
import type { AppRoute } from '../shell/SidebarNav'
import { MaterialIcon } from '../shell/MaterialIcon'

type AuthMode = 'login' | 'signup'

const inputClassName =
  'w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 font-body text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

type AuthModalProps = {
  isOpen: boolean
  mode: AuthMode
  redirectRoute?: AppRoute
  onClose: () => void
  onSuccess: (route: AppRoute) => void
  onSwitchMode: (mode: AuthMode) => void
}

export function AuthModal({
  isOpen,
  mode,
  redirectRoute,
  onClose,
  onSuccess,
  onSwitchMode,
}: AuthModalProps) {
  const { login, register } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    setError(null)
    setShowPassword(false)
    setShowPasswordConfirm(false)
  }, [mode])

  if (!isOpen) return null

  function finish(role: UserRole) {
    const target = redirectRoute ?? defaultRouteForRole(role)
    onSuccess(target)
    onClose()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isLoading) return
    setError(null)

    if (mode === 'signup' && password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setIsLoading(true)
    try {
      if (mode === 'login') {
        const session = await login(email, password)
        finish(session.role)
      } else {
        const session = await register({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email,
          password,
          passwordConfirm,
        })
        finish(session.role)
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Action impossible.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-surface-container-lowest p-space-lg shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
          aria-label="Fermer"
        >
          <MaterialIcon name="close" className="text-[22px]" />
        </button>

        <div className="mb-space-md flex items-center gap-space-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container">
            <MaterialIcon name="balance" className="text-[22px] text-surface" />
          </div>
          <div>
            <h2 id="auth-modal-title" className="font-headline text-headline-sm text-primary">
              {mode === 'login' ? 'Connexion' : 'Créer un compte'}
            </h2>
            <p className="font-body text-body-sm text-on-surface-variant">
              {mode === 'login'
                ? 'Retrouvez votre espace Nyateƒe.'
                : 'Compte citoyen : accédez à l\'assistant juridique.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {mode === 'signup' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block font-label text-label-sm text-on-surface">
                  Prénom
                </span>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                  placeholder="Ex. : Koffi"
                  className={inputClassName}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-label text-label-sm text-on-surface">
                  Nom
                </span>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                  placeholder="Ex. : Mensah"
                  className={inputClassName}
                />
              </label>
            </div>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block font-label text-label-sm text-on-surface">
              Adresse e-mail
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="vous@exemple.tg"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block font-label text-label-sm text-on-surface">
              Mot de passe
            </span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'signup' ? 8 : 1}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={`${inputClassName} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((open) => !open)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                <MaterialIcon
                  name={showPassword ? 'visibility_off' : 'visibility'}
                  className="text-[20px]"
                />
              </button>
            </div>
            {mode === 'signup' ? (
              <span className="mt-1 block font-body text-body-sm text-on-surface-variant">
                Au moins 8 caractères.
              </span>
            ) : null}
          </label>

          {mode === 'signup' ? (
            <label className="block">
              <span className="mb-1.5 block font-label text-label-sm text-on-surface">
                Confirmer le mot de passe
              </span>
              <div className="relative">
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={`${inputClassName} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm((open) => !open)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
                  aria-label={
                    showPasswordConfirm
                      ? 'Masquer la confirmation'
                      : 'Afficher la confirmation'
                  }
                >
                  <MaterialIcon
                    name={showPasswordConfirm ? 'visibility_off' : 'visibility'}
                    className="text-[20px]"
                  />
                </button>
              </div>
            </label>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 font-body text-body-sm text-error">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-shine flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container py-3 font-label text-label-md text-surface transition-colors hover:bg-primary disabled:opacity-60"
          >
            {isLoading ? (
              'Patientez...'
            ) : mode === 'login' ? (
              <>
                <MaterialIcon name="login" className="text-[20px]" />
                Se connecter
              </>
            ) : (
              <>
                <MaterialIcon name="person_add" className="text-[20px]" />
                Créer mon compte
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center font-body text-body-sm text-on-surface-variant">
          {mode === 'login' ? (
            <>
              Pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => onSwitchMode('signup')}
                className="font-label text-label-sm font-semibold text-primary-container hover:underline"
              >
                S&apos;inscrire
              </button>
            </>
          ) : (
            <>
              Déjà inscrit ?{' '}
              <button
                type="button"
                onClick={() => onSwitchMode('login')}
                className="font-label text-label-sm font-semibold text-primary-container hover:underline"
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
