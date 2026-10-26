import { Reveal } from '../components/motion/Reveal'
import { MaterialIcon } from '../components/shell/MaterialIcon'
import { PUBLIC_PROFILE_LABELS, type AuthUser } from '../lib/auth-types'

type DashboardViewProps = {
  user: AuthUser
}

function dashboardHint(user: AuthUser): string {
  if (user.role === 'cabinet' || user.role === 'admin') {
    return 'Consultez la bibliothèque, l’assistant et la rédaction assistée pour vos dossiers.'
  }
  switch (user.publicProfile) {
    case 'student':
      return 'Retrouvez rapidement un texte, un article ou une règle pour vos travaux.'
    case 'enterprise':
      return 'Orientez-vous sur les questions juridiques du quotidien de votre activité.'
    default:
      return 'Comprenez vos droits et obligations en posant vos questions à l’assistant.'
  }
}

export function DashboardView({ user }: DashboardViewProps) {
  return (
    <div className="px-margin py-space-lg">
      <Reveal delayMs={0}>
      <p className="font-label text-label-sm uppercase tracking-widest text-primary-container">
        {PUBLIC_PROFILE_LABELS[user.publicProfile]}
      </p>
      <h1 className="font-headline text-headline-lg text-primary">
        Bienvenue, {user.displayName}
      </h1>
      <p className="mt-2 max-w-2xl font-body text-body-md text-on-surface-variant">
        {dashboardHint(user)}
      </p>
      </Reveal>

      <div className="mt-space-lg grid gap-gutter md:grid-cols-3">
        {[
          {
            label: 'Assistant',
            value: 'Questions en langage clair',
            icon: 'forum',
          },
          {
            label: 'Sources',
            value: 'Lois, codes et décrets togolais',
            icon: 'menu_book',
          },
          {
            label: 'Rappel',
            value: 'Orientation, pas conseil personnalisé',
            icon: 'policy',
          },
        ].map((stat, index) => (
          <Reveal key={stat.label} delayMs={index * 90}>
          <div
            className="card-lift rounded-xl bg-surface-container-low p-space-lg shadow-sm"
          >
            <MaterialIcon name={stat.icon} className="text-primary" />
            <p className="mt-space-sm font-label text-label-sm text-secondary">
              {stat.label}
            </p>
            <p className="font-headline text-headline-sm text-primary">{stat.value}</p>
          </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
