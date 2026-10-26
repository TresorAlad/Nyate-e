import { PublicPageShell } from '../components/landing/PublicPageShell'
import { Reveal } from '../components/motion/Reveal'
import type { AuthUser, PublicProfile } from '../lib/auth-types'
import type { AppRoute } from '../components/shell/SidebarNav'

const CONTACT_EMAIL = 'contact@nyatefe.tg'

type ConfidentialiteViewProps = {
  user: AuthUser | null
  onNavigate: (route: AppRoute) => void
  onOpenAuth: (
    mode: 'login' | 'signup',
    redirect?: AppRoute,
    initialPublicProfile?: PublicProfile,
  ) => void
}

export function ConfidentialiteView({
  user,
  onNavigate,
  onOpenAuth,
}: ConfidentialiteViewProps) {
  return (
    <PublicPageShell
      user={user}
      pageKey="confidentialite"
      title="Politique de confidentialité"
      onNavigate={onNavigate}
      onOpenAuth={onOpenAuth}
    >
      <Reveal delayMs={0}>
        <p className="font-body text-body-md text-on-surface-variant">
          Les données de compte (nom, adresse e-mail) servent à vous identifier sur
          Nyateƒe et à personnaliser votre espace.
        </p>
      </Reveal>
      <Reveal delayMs={80}>
        <p className="font-body text-body-md text-on-surface-variant">
          Les questions posées à l&apos;assistant sont traitées pour générer une
          réponse fondée sur des sources officielles. Elles ne sont pas revendues à
          des tiers.
        </p>
      </Reveal>
      <Reveal delayMs={160}>
        <p className="font-body text-body-md text-on-surface-variant">
          Pour exercer vos droits ou poser une question sur vos données, contactez-nous
          à{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-primary-container hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Reveal>
    </PublicPageShell>
  )
}
