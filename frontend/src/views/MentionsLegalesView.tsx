import { Reveal } from '../components/motion/Reveal'
import { PublicPageShell } from '../components/landing/PublicPageShell'
import type { AuthUser, PublicProfile } from '../lib/auth-types'
import type { AppRoute } from '../components/shell/SidebarNav'

type MentionsLegalesViewProps = {
  user: AuthUser | null
  onNavigate: (route: AppRoute) => void
  onOpenAuth: (
    mode: 'login' | 'signup',
    redirect?: AppRoute,
    initialPublicProfile?: PublicProfile,
  ) => void
}

export function MentionsLegalesView({
  user,
  onNavigate,
  onOpenAuth,
}: MentionsLegalesViewProps) {
  return (
    <PublicPageShell
      user={user}
      pageKey="mentions-legales"
      title="Mentions légales"
      onNavigate={onNavigate}
      onOpenAuth={onOpenAuth}
    >
      <Reveal delayMs={0}>
        <p className="font-body text-body-md text-on-surface-variant">
          Nyateƒe est édité par l&apos;initiative AI4Youth, basée à Lomé, République
          togolaise.
        </p>
      </Reveal>
      <Reveal delayMs={80}>
        <p className="font-body text-body-md text-on-surface-variant">
          La plateforme fournit une aide à la compréhension du droit togolais. Elle
          ne se substitue pas à un avocat ou à un juriste inscrit au Barreau de Lomé.
        </p>
      </Reveal>
      <Reveal delayMs={160}>
        <p className="font-body text-body-md text-on-surface-variant">
          Les contenus sont fournis à titre informatif. Pour toute décision engageant
          votre responsabilité, consultez un professionnel du droit qualifié.
        </p>
      </Reveal>
    </PublicPageShell>
  )
}
