import { useState, type FormEvent } from 'react'

import { MaterialIcon } from '../components/shell/MaterialIcon'
import { useAuth } from '../context/AuthContext'
import {
  PUBLIC_PROFILE_LABELS,
  type PublicProfile,
} from '../lib/auth-types'

const inputClassName =
  'w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 font-body text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export function ProfilView() {
  const { user, updateProfile } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [publicProfile, setPublicProfile] = useState<PublicProfile>(
    user?.publicProfile ?? 'citizen',
  )
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (!user) return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isSaving) return
    setError(null)
    setSuccess(null)
    setIsSaving(true)
    try {
      await updateProfile({
        displayName,
        email,
        publicProfile,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      })
      setCurrentPassword('')
      setNewPassword('')
      setSuccess('Vos informations ont été enregistrées.')
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Impossible d\'enregistrer le profil.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <p className="font-label text-label-sm uppercase tracking-wider text-secondary">
        Compte
      </p>
      <h2 className="mt-1 font-headline text-headline-md text-primary">
        Votre profil
      </h2>
      <p className="mt-2 font-body text-body-md text-on-surface-variant">
        Modifiez votre nom, votre adresse e-mail ou votre mot de passe. Le type de
        profil adapte les suggestions de l&apos;assistant.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
        <label className="block">
          <span className="mb-1.5 block font-label text-label-sm text-on-surface">
            Nom affiché
          </span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            autoComplete="name"
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-label text-label-sm text-on-surface">
            Adresse e-mail
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block font-label text-label-sm text-on-surface">
            Vous êtes
          </span>
          <select
            value={publicProfile}
            onChange={(event) =>
              setPublicProfile(event.target.value as PublicProfile)
            }
            className={inputClassName}
          >
            {(Object.keys(PUBLIC_PROFILE_LABELS) as PublicProfile[]).map((key) => (
              <option key={key} value={key}>
                {PUBLIC_PROFILE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-2 rounded-2xl bg-surface-container-low p-4">
          <p className="mb-3 font-label text-label-md font-semibold text-primary">
            Mot de passe
          </p>
          <label className="block">
            <span className="mb-1.5 block font-label text-label-sm text-on-surface">
              Mot de passe actuel
            </span>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                className={`${inputClassName} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((open) => !open)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
                aria-label={
                  showCurrent
                    ? 'Masquer le mot de passe actuel'
                    : 'Afficher le mot de passe actuel'
                }
              >
                <MaterialIcon
                  name={showCurrent ? 'visibility_off' : 'visibility'}
                  className="text-[20px]"
                />
              </button>
            </div>
          </label>
          <label className="mt-3 block">
            <span className="mb-1.5 block font-label text-label-sm text-on-surface">
              Nouveau mot de passe
            </span>
            <div className="relative">
              <input
                type={showNext ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                placeholder="Laisser vide pour ne pas changer"
                className={`${inputClassName} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowNext((open) => !open)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
                aria-label={
                  showNext
                    ? 'Masquer le nouveau mot de passe'
                    : 'Afficher le nouveau mot de passe'
                }
              >
                <MaterialIcon
                  name={showNext ? 'visibility_off' : 'visibility'}
                  className="text-[20px]"
                />
              </button>
            </div>
            <span className="mt-1 block font-body text-body-sm text-on-surface-variant">
              Requis uniquement pour changer l&apos;e-mail ou le mot de passe.
            </span>
          </label>
        </div>

        {error ? (
          <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 font-body text-body-sm text-error">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg bg-tertiary-fixed px-3 py-2 font-body text-body-sm text-on-tertiary-fixed">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-label text-label-md text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"
        >
          <MaterialIcon name="save" className="text-[18px]" />
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
