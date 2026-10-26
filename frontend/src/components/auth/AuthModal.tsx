import { useEffect, useState, type FormEvent } from 'react'

import { useAuth } from '../../context/AuthContext'
import {
  PUBLIC_PROFILE_LABELS,
  type PublicProfile,
  type UserRole,
} from '../../lib/auth-types'
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
  initialPublicProfile?: PublicProfile
  onClose: () => void
  onSuccess: (route: AppRoute) => void
  onSwitchMode: (mode: AuthMode) => void
}

export function AuthModal({
  isOpen,
  mode,
  redirectRoute,
  initialPublicProfile,
  onClose,
  onSuccess,
  onSwitchMode,
}: AuthModalProps) {
  const { login, register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [publicProfile, setPublicProfile] = useState<PublicProfile>('citizen')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && initialPublicProfile) {
      setPublicProfile(initialPublicProfile)
    }
  }, [isOpen, initialPublicProfile])

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
    setIsLoading(true)
    try {
      if (mode === 'login') {
        const session = login(email, password)
        finish(session.role)
      } else {
        const session = register({
          email,
          password,
          displayName,
          publicProfile,
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
    >
      <div className="relative w-full max-w-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-2xl">
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
              Accédez à votre espace Nyateƒe sécurisé.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {mode === 'signup' ? (
            <>
              <label className="block">
                <span className="mb-1.5 block font-label text-label-sm text-on-surface">
                  Nom ou structure
                </span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  autoComplete="name"
                  className={inputClassName}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-label text-label-sm text-on-surface">
                  Vous êtes
                </span>
                <select
                  value={publicProfile}
                  onChange={(e) =>
                    setPublicProfile(e.target.value as PublicProfile)
                  }
                  className={inputClassName}
                >
                  {(Object.keys(PUBLIC_PROFILE_LABELS) as PublicProfile[]).map(
                    (key) => (
                      <option key={key} value={key}>
                        {PUBLIC_PROFILE_LABELS[key]}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </>
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
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block font-label text-label-sm text-on-surface">
              Mot de passe
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'signup' ? 8 : 1}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className={inputClassName}
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-error-container bg-error-container/30 px-3 py-2 font-body text-body-sm text-on-error-container">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-container py-3 font-label text-label-md text-surface transition-colors hover:bg-primary disabled:opacity-60"
          >
            {isLoading ? (
              'Patientez…'
            ) : mode === 'login' ? (
              <>
                <MaterialIcon name="login" className="text-[20px]" />
                Se connecter
              </>
            ) : (
              <>
                <MaterialIcon name="person_add" className="text-[20px]" />
                S&apos;inscrire
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
