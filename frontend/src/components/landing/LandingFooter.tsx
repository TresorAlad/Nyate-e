import type { AppRoute } from '../shell/SidebarNav'

const CONTACT_EMAIL = 'contact@nyatefe.tg'

type LandingFooterProps = {
  onNavigate: (route: AppRoute) => void
  onProfilsClick?: () => void
}

export function LandingFooter({ onNavigate, onProfilsClick }: LandingFooterProps) {
  return (
    <footer className="w-full border-t border-outline-variant/30 bg-surface-container">
      <div className="mx-auto max-w-7xl px-margin py-space-xl">
        <div className="grid gap-space-lg md:grid-cols-12">
          <div className="md:col-span-5">
            <span className="font-headline text-headline-sm text-primary">Nyateƒe</span>
            <p className="mt-space-sm max-w-md font-body text-body-md text-on-surface-variant">
              Portail d&apos;intelligence juridique pour le droit togolais : doctrine,
              législation et assistant fondé sur des sources vérifiables.
            </p>
            <p className="mt-space-md font-label text-label-sm text-on-surface-variant">
              Initiative AI4Youth · Lomé, Togo
            </p>
          </div>

          <div className="md:col-span-3">
            <h3 className="font-label text-label-md font-semibold text-primary">Contact</h3>
            <ul className="mt-space-sm space-y-2 font-body text-body-sm text-on-surface-variant">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary-container hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>Lomé, République togolaise</li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-label text-label-md font-semibold text-primary">Plateforme</h3>
            <ul className="mt-space-sm space-y-2 font-body text-body-sm text-on-surface-variant">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('assistant')}
                  className="transition-colors hover:text-primary"
                >
                  Assistant juridique
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('bibliotheque')}
                  className="transition-colors hover:text-primary"
                >
                  Bibliothèque
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onProfilsClick) {
                      sessionStorage.removeItem('nyatefe_scroll_profils')
                    }
                    onNavigate('accueil')
                    window.setTimeout(() => {
                      document.getElementById('methode')?.scrollIntoView({ behavior: 'smooth' })
                    }, 400)
                  }}
                  className="transition-colors hover:text-primary"
                >
                  Méthode
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-label text-label-md font-semibold text-primary">Informations</h3>
            <ul className="mt-space-sm space-y-2 font-body text-body-sm">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onProfilsClick) {
                      onProfilsClick()
                      return
                    }
                    sessionStorage.setItem('nyatefe_scroll_profils', '1')
                    onNavigate('accueil')
                  }}
                  className="text-on-surface-variant transition-colors hover:text-primary"
                >
                  Publics visés
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('mentions-legales')}
                  className="text-on-surface-variant transition-colors hover:text-primary"
                >
                  Mentions légales
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('confidentialite')}
                  className="text-on-surface-variant transition-colors hover:text-primary"
                >
                  Politique de confidentialité
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('accueil')
                    window.setTimeout(() => {
                      document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })
                    }, 400)
                  }}
                  className="text-on-surface-variant transition-colors hover:text-primary"
                >
                  Questions fréquentes
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-space-xl flex flex-col items-center justify-between gap-space-md border-t border-outline-variant/25 pt-space-md md:flex-row">
          <span className="font-label text-label-sm text-on-surface-variant">
            © 2026 Nyateƒe · République togolaise · Tous droits réservés
          </span>
          <span className="text-center font-label text-label-sm font-medium text-tertiary">
            Conformité déontologique · Barreau de Lomé
          </span>
        </div>
      </div>
    </footer>
  )
}
