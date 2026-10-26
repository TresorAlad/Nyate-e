import { useEffect, useState } from 'react'

import { AssistantPreview } from '../components/landing/AssistantPreview'
import { CountUp } from '../components/landing/CountUp'
import { FaqList } from '../components/landing/FaqList'
import { HeroAtmosphere } from '../components/landing/HeroAtmosphere'
import { LandingFooter } from '../components/landing/LandingFooter'
import { LandingHeader } from '../components/landing/LandingHeader'
import { MarqueeStrip } from '../components/landing/MarqueeStrip'
import { TiltCard } from '../components/landing/TiltCard'
import { PageEnter } from '../components/motion/PageEnter'
import { Reveal } from '../components/motion/Reveal'
import { MaterialIcon } from '../components/shell/MaterialIcon'
import type { AppRoute } from '../components/shell/SidebarNav'
import type { AuthUser, PublicProfile } from '../lib/auth-types'
import { setPendingQuestion } from '../lib/pending-question'

const LANDING_PUBLICS: {
  icon: string
  title: string
  text: string
  profile: PublicProfile
}[] = [
  {
    icon: 'groups',
    title: 'Citoyens',
    text: 'Comprendre ses droits et ses obligations dans un langage accessible, sans jargon inutile.',
    profile: 'citizen',
  },
  {
    icon: 'school',
    title: 'Étudiants',
    text: 'Retrouver rapidement un texte, un article ou une règle pour vos travaux et révisions.',
    profile: 'student',
  },
  {
    icon: 'business',
    title: 'Entreprises',
    text: "S'orienter sur les questions juridiques du quotidien : société, contrats, formalités.",
    profile: 'enterprise',
  },
  {
    icon: 'gavel',
    title: 'Juristes',
    text: 'Gagner du temps dans la recherche de sources officielles, avec références affichées.',
    profile: 'jurist',
  },
]

const METHOD_STEPS = [
  {
    n: '01',
    icon: 'dialpad',
    title: 'Analyser',
    subtitle: 'Compréhension et qualification',
    text: 'Identification de la branche concernée, des faits pertinents et de la question juridique réelle.',
  },
  {
    n: '02',
    icon: 'travel_explore',
    title: 'Rechercher',
    subtitle: 'Textes officiels pertinents',
    text: 'Parcours des lois, codes et décrets enregistrés dans Nyateƒe pour citer ce qui s\'applique à votre situation.',
  },
  {
    n: '03',
    icon: 'verified_user',
    title: 'Vérifier',
    subtitle: 'Contrôle et traçabilité',
    text: 'Réponse reliée aux extraits officiels, avec références visibles avant toute synthèse.',
  },
]

const PILLARS = [
  {
    icon: 'foundation',
    tag: 'Loi 2018-005',
    title: 'Foncier et propriété coutumière',
    text: 'Vente, immatriculation, attestation coutumière et régimes de propriété.',
    query: "Quelles sont les conditions de validité d'une vente de terrain coutumier ?",
  },
  {
    icon: 'family_restroom',
    tag: 'Code des personnes',
    title: 'Famille et successions',
    text: 'Mariage, filiation, dévolution successorale et droits des héritiers.',
    query: 'Comment se déroule la succession selon le Code des personnes togolais ?',
  },
  {
    icon: 'account_balance',
    tag: 'Espace OHADA',
    title: 'Droit commercial et OHADA',
    text: 'Création de société, CFE, actes de commerce et sûretés.',
    query: 'Quelles sont les formalités pour créer une SARL au CFE Lomé ?',
  },
  {
    icon: 'work',
    tag: 'Code du travail',
    title: 'Travail et protection sociale',
    text: 'Contrat, licenciement, salaires et obligations de l\'employeur.',
    query: 'Quelles sont les règles de licenciement selon le Code du travail togolais ?',
  },
  {
    icon: 'gavel',
    tag: 'Code pénal',
    title: 'Droit pénal',
    text: 'Infractions, peines et procédures applicables au Togo.',
    query: 'Quelle est la distinction entre contravention, délit et crime en droit togolais ?',
  },
  {
    icon: 'assured_workload',
    tag: 'Droit public',
    title: 'Administration et constitution',
    text: 'Actes administratifs, utilité publique et garanties constitutionnelles.',
    query: "Dans quels cas l'État peut-il exproprier pour cause d'utilité publique au Togo ?",
  },
]

const WHY_ITEMS = [
  {
    icon: 'public',
    title: 'Droit togolais d\'abord',
    text: 'Pas un modèle générique. Nyateƒe est ancré dans les spécificités nationales, l\'OHADA et la coutume reconnue.',
  },
  {
    icon: 'menu_book',
    title: 'Sources toujours visibles',
    text: 'Chaque réponse cite les extraits officiels. Vous vérifiez, vous creusez, vous décidez.',
  },
  {
    icon: 'psychology',
    title: 'Mode délibéré',
    text: 'Analyser, rechercher, vérifier : un protocole qui limite les approximations.',
  },
  {
    icon: 'shield_with_heart',
    title: 'Déontologie claire',
    text: 'Un assistant, jamais un substitut à l\'avocat. Indépendance et limites affichées.',
  },
]

const MARQUEE_LAWS = [
  'Code foncier et domanial',
  'Code des personnes et de la famille',
  'Acte uniforme OHADA',
  'Journal officiel du Togo',
  'Constitution togolaise',
  'Code du travail',
  'Code pénal',
  'Loi 2018-005',
]

const MARQUEE_TOPICS = [
  'Attestation coutumière',
  'Dévolution successorale',
  'Création SARL',
  'Immatriculation foncière',
  'Expropriation',
  'Contrat de travail',
  'CFE Lomé',
  'Sûretés OHADA',
]

const PROMPT_CHIPS = [
  'Attestation coutumière (ADC)',
  'Dévolution successorale',
  'Création SARL et OHADA',
]

const IMG_ARCHIVES =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCn6Ww0EeHltqLCs9n22YgIzHzQq6LpNhj6lrbElEZx6DGazSZokJNFqjFAAn7JT8dLoP7SrEcbR-FrN5vHkHKQHVy90o2qpfmozPxkoWEL-GiPCpocKbnhyTKWqYVpF2PD5N9vEE3NzfPpQK5rK4FpQyZuwjAXry_JddC8m7ezQKReMjSH6KX2bJiSIOErR7XSJIlc86BFFm6cW_Mlzla1N_skcqZegF5G_bmlPWU6ymavbd25DQP0rg'
const IMG_PALAIS =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCyCLNqEM6r2px8zHo-BcCbviexZ8E6XbTcXCRXYoycHghZTWNAXPSjiJ4Bo7oMBXYkVWBqhZPgf1S7XlMVKi9GpTdHUggzqXtrQIKeDT5GesJmtri2-oUywEgentwjF8jKdyKyQg1ggwUR5nFF7pPGf7p1lAWsnteqdSOfvgM_fQE045iiTy1cBFHakxwPUtdpupYabneLqXUzFUlGAXPTnbVXoXr9cHX3kvVSG0xCKYcNYznZoIZObg'

type LandingViewProps = {
  user: AuthUser | null
  onNavigate: (route: AppRoute) => void
  onOpenAuth: (
    mode: 'login' | 'signup',
    redirect?: AppRoute,
    initialPublicProfile?: PublicProfile,
  ) => void
}

const SCROLL_PROFILS_KEY = 'nyatefe_scroll_profils'

export function LandingView({ user, onNavigate, onOpenAuth }: LandingViewProps) {
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    if (sessionStorage.getItem(SCROLL_PROFILS_KEY) !== '1') return
    sessionStorage.removeItem(SCROLL_PROFILS_KEY)
    const timer = window.setTimeout(() => {
      document.getElementById('profils')?.scrollIntoView({ behavior: 'smooth' })
    }, 400)
    return () => window.clearTimeout(timer)
  }, [])

  function goToProfils() {
    sessionStorage.setItem(SCROLL_PROFILS_KEY, '1')
    onNavigate('accueil')
    window.setTimeout(() => {
      document.getElementById('profils')?.scrollIntoView({ behavior: 'smooth' })
    }, 400)
  }

  function goToAssistant(question: string) {
    const trimmed = question.trim()
    if (!trimmed) return
    setPendingQuestion(trimmed)
    onNavigate('assistant')
  }

  function scrollToId(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background font-body text-body-md text-on-surface">
      <LandingHeader user={user} onNavigate={onNavigate} onOpenAuth={onOpenAuth} />

      <PageEnter pageKey="accueil">
        <main className="w-full bg-background pt-20">
          <section className="relative w-full overflow-hidden px-margin pb-space-md pt-space-lg">
            <HeroAtmosphere />
            <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-space-lg">
              <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
                <div className="flex flex-col gap-space-md lg:col-span-7">
                  <div className="flex flex-wrap items-center gap-space-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-primary-container" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-container" />
                      </span>
                      <span className="font-label text-label-sm font-semibold uppercase tracking-widest text-primary">
                        Nyateƒe · IA juridique spécialisée
                      </span>
                    </span>
                    <span className="font-label text-label-sm italic text-on-surface-variant">
                      « La vérité juridique à la portée de tous. »
                    </span>
                  </div>

                  <h1 className="font-headline text-display-lg tracking-tight text-primary">
                    <span className="hero-line" style={{ animationDelay: '80ms' }}>
                      Le droit togolais,
                    </span>
                    <span
                      className="hero-line font-headline font-normal italic text-gradient-shift"
                      style={{ animationDelay: '280ms' }}
                    >
                      plus accessible.
                    </span>
                  </h1>

                  <p
                    className="hero-line max-w-2xl font-body text-body-lg text-on-surface-variant"
                    style={{ animationDelay: '460ms' }}
                  >
                    Posez votre question. Obtenez une explication claire, appuyée sur
                    des sources vérifiées issues des textes officiels enregistrés dans Nyateƒe.
                  </p>

                  <div
                    className="hero-line search-glow w-full rounded-2xl bg-surface-container-lowest p-space-md"
                    style={{ animationDelay: '620ms' }}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-space-xs">
                        <MaterialIcon name="psychology" className="text-[20px] text-primary-container" />
                        <span className="font-headline text-headline-sm text-primary">
                          Requête en langage naturel
                        </span>
                      </div>
                      <span className="rounded-full bg-tertiary-fixed px-2.5 py-1 font-label text-label-sm font-semibold text-on-tertiary-fixed">
                        Mode délibéré
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') goToAssistant(prompt)
                        }}
                        placeholder="Ex. : procédure d'immatriculation d'un terrain ?"
                        className="w-full rounded-xl bg-surface-container-low px-space-md py-3.5 pr-4 font-body text-body-md text-on-surface placeholder:text-outline focus:bg-surface focus:outline-none sm:pr-36"
                      />
                      <button
                        type="button"
                        onClick={() => goToAssistant(prompt)}
                        className="btn-shine absolute right-2 hidden items-center gap-1 rounded-lg bg-primary-container px-3 py-2 font-label text-label-md text-surface transition-colors hover:bg-primary sm:flex"
                      >
                        <span>Consulter</span>
                        <MaterialIcon name="arrow_forward" className="text-[16px]" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToAssistant(prompt)}
                      className="btn-shine mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-primary-container py-3 font-label text-label-md text-surface sm:hidden"
                    >
                      Consulter
                      <MaterialIcon name="arrow_forward" className="text-[16px]" />
                    </button>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {PROMPT_CHIPS.map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setPrompt(label)}
                          className="rounded-full bg-surface-container-high px-3 py-1 font-label text-label-sm text-on-surface transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-variant"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    className="hero-line flex w-full flex-col gap-space-sm sm:flex-row"
                    style={{ animationDelay: '760ms' }}
                  >
                    <button
                      type="button"
                      onClick={() => goToAssistant(prompt || 'Quels sont mes droits en droit togolais ?')}
                      className="btn-shine flex w-full items-center justify-center gap-space-xs rounded-xl bg-primary-container px-space-md py-3 text-surface shadow-md transition-all duration-200 hover:bg-primary hover:shadow-lg"
                    >
                      <MaterialIcon name="chat" className="text-[20px]" />
                      <span className="font-label text-label-md">Poser une question</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('bibliotheque')}
                      className="flex w-full items-center justify-center gap-space-xs rounded-xl bg-surface-container px-space-md py-3 text-primary-container shadow-sm transition-all duration-200 hover:bg-surface-variant"
                    >
                      <MaterialIcon name="menu_book" className="text-[20px]" />
                      <span className="font-label text-label-md">Explorer les textes</span>
                    </button>
                  </div>

                  <div
                    className="hero-line flex flex-wrap items-center gap-4 text-on-surface-variant"
                    style={{ animationDelay: '860ms' }}
                  >
                    <div className="flex items-center gap-1">
                      <MaterialIcon name="verified" className="text-[16px] text-tertiary" />
                      <span className="font-label text-label-sm">Lois et codes togolais</span>
                    </div>
                    <span className="text-outline-variant">·</span>
                    <div className="flex items-center gap-1">
                      <MaterialIcon name="library_books" className="text-[16px] text-tertiary" />
                      <span className="font-label text-label-sm">Sources officielles et JO</span>
                    </div>
                    <span className="text-outline-variant">·</span>
                    <div className="flex items-center gap-1">
                      <MaterialIcon name="balance" className="text-[16px] text-tertiary" />
                      <span className="font-label text-label-sm">OHADA et coutume</span>
                    </div>
                  </div>
                </div>

                <div className="hero-line px-2 lg:col-span-5 lg:px-4" style={{ animationDelay: '380ms' }}>
                  <AssistantPreview />
                </div>
              </div>

              <button
                type="button"
                onClick={() => scrollToId('methode')}
                className="mx-auto flex flex-col items-center gap-1 text-on-surface-variant"
                aria-label="Découvrir la méthode"
              >
                <span className="font-label text-label-sm uppercase tracking-widest">Découvrir</span>
                <MaterialIcon name="keyboard_arrow_down" className="scroll-hint text-[28px]" />
              </button>
            </div>
          </section>

          <section className="w-full space-y-3 bg-surface-container-low py-space-md">
            <MarqueeStrip items={MARQUEE_LAWS} direction="left" />
            <MarqueeStrip items={MARQUEE_TOPICS} direction="right" />
          </section>

          <Reveal as="section" className="w-full px-margin py-space-xl">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-space-md md:grid-cols-4">
              {[
                { end: 4, suffix: '', label: 'Publics accompagnés', icon: 'groups' },
                { end: 3, suffix: '', label: 'Étapes de contrôle', icon: 'account_tree' },
                { end: 100, suffix: '%', label: 'Réponses sourcées', icon: 'verified' },
                { end: 1, suffix: '', label: 'Droit national d\'abord', icon: 'flag' },
              ].map((stat, index) => (
                <Reveal key={stat.label} delayMs={index * 90} variant="scale">
                  <div className="flex flex-col items-start gap-2 rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
                    <MaterialIcon name={stat.icon} className="text-[22px] text-primary-container" />
                    <p className="font-headline text-headline-lg text-primary">
                      <CountUp end={stat.end} suffix={stat.suffix} />
                    </p>
                    <p className="font-label text-label-sm text-on-surface-variant">{stat.label}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal as="section" className="w-full bg-surface-container-low px-margin py-space-xl">
            <div className="mx-auto max-w-7xl">
              <Reveal delayMs={0}>
                <span className="font-label text-label-sm font-semibold uppercase tracking-widest text-primary-container">
                  Pourquoi Nyateƒe
                </span>
                <h2 className="mt-space-xs font-headline text-headline-lg text-primary">
                  Une intelligence juridique ancrée au Togo
                </h2>
                <p className="mt-space-sm max-w-2xl font-body text-body-md text-on-surface-variant">
                  Conçue pour le droit national, pas pour un droit universel. La clarté
                  n&apos;excuse jamais l&apos;absence de source.
                </p>
              </Reveal>
              <div className="mt-space-lg grid gap-space-md sm:grid-cols-2 lg:grid-cols-4">
                {WHY_ITEMS.map((item, index) => (
                  <Reveal key={item.title} delayMs={index * 80} variant={index % 2 === 0 ? 'left' : 'right'}>
                    <article className="card-lift flex h-full flex-col rounded-2xl bg-surface-container-lowest p-space-md shadow-md">
                      <div className="mb-space-sm flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container text-primary-container">
                        <MaterialIcon name={item.icon} className="text-[22px]" />
                      </div>
                      <h3 className="font-headline text-headline-sm text-primary">{item.title}</h3>
                      <p className="mt-2 font-body text-body-sm text-on-surface-variant">{item.text}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal as="section" id="methode" className="w-full scroll-mt-24 px-margin py-space-xl">
            <div className="mx-auto flex max-w-7xl flex-col gap-space-lg">
              <Reveal delayMs={0}>
                <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
                  <div className="flex max-w-xl flex-col gap-space-xs">
                    <span className="font-label text-label-sm font-semibold uppercase tracking-widest text-primary-container">
                      Rigueur délibérative
                    </span>
                    <h2 className="font-headline text-headline-lg text-primary">
                      Trois étapes vers la certitude juridique
                    </h2>
                  </div>
                  <p className="max-w-md font-body text-body-md text-on-surface-variant">
                    Chaque réponse synthétisée par Nyateƒe traverse un protocole strict
                    qui limite les erreurs et ancre la réponse dans les sources officielles
                    enregistrées dans Nyateƒe.
                  </p>
                </div>
              </Reveal>
              <div className="relative grid grid-cols-1 gap-space-lg md:grid-cols-3">
                <svg
                  className="pointer-events-none absolute left-[16%] top-10 hidden h-2 w-[68%] md:block"
                  viewBox="0 0 100 8"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <line
                    className="dash-flow text-outline-variant"
                    x1="0"
                    y1="4"
                    x2="100"
                    y2="4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                {METHOD_STEPS.map((step, index) => (
                  <Reveal key={step.n} delayMs={index * 100} variant="up">
                    <div className="card-lift relative flex h-full flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-lg shadow-md hover:shadow-xl">
                      <div className="flex flex-col gap-space-md">
                        <div className="flex items-center justify-between">
                          <span className="font-headline text-headline-md text-outline-variant">{step.n}</span>
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-primary-container">
                            <MaterialIcon name={step.icon} className="text-[24px]" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-headline text-headline-sm text-primary">{step.title}</h3>
                          <p className="font-label text-label-md font-medium text-primary-container">
                            {step.subtitle}
                          </p>
                          <p className="mt-2 font-body text-body-md text-on-surface-variant">{step.text}</p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              <div className="flex flex-col items-center justify-between gap-space-md rounded-2xl bg-surface-container p-space-md sm:flex-row">
                <div className="flex items-center gap-space-sm">
                  <MaterialIcon name="policy" className="text-[28px] text-primary" />
                  <div>
                    <span className="block font-label text-label-md font-semibold text-primary">
                      Indépendance et déontologie
                    </span>
                    <span className="font-body text-body-sm text-on-surface-variant">
                      Nyateƒe assiste la réflexion sans remplacer un avocat inscrit au
                      Barreau de Lomé.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal as="section" className="w-full px-margin py-space-xl">
            <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-space-lg lg:grid-cols-12">
              <Reveal className="grid grid-cols-2 gap-space-md lg:col-span-6" variant="left">
                <div className="flex flex-col gap-space-md">
                  <div className="relative h-64 overflow-hidden rounded-2xl bg-surface-container shadow-lg">
                    <img src={IMG_ARCHIVES} alt="Archives législatives" className="kenburns h-full w-full object-cover" />
                    <div className="absolute bottom-2 left-2 rounded bg-primary px-2 py-1 font-label text-label-sm text-surface">
                      Archives législatives
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-space-md pt-8">
                  <div className="relative h-64 overflow-hidden rounded-2xl bg-surface-container shadow-lg">
                    <img src={IMG_PALAIS} alt="Palais de justice, Lomé" className="kenburns h-full w-full object-cover" />
                    <div className="absolute bottom-2 left-2 rounded bg-primary px-2 py-1 font-label text-label-sm text-surface">
                      Palais de justice, Lomé
                    </div>
                  </div>
                </div>
              </Reveal>
              <Reveal className="flex flex-col gap-space-md lg:col-span-6 lg:pl-space-md" variant="right">
                <span className="font-label text-label-sm font-semibold uppercase tracking-widest text-primary-container">
                  Une technologie souveraine
                </span>
                <h2 className="font-headline text-headline-lg leading-tight text-primary lg:text-display-lg-mobile">
                  L&apos;intelligence artificielle dédiée aux spécificités de notre droit
                  national.
                </h2>
                <p className="font-body text-body-lg text-on-surface-variant">
                  Le droit togolais combine droit codifié, OHADA et coutumes reconnues.
                  Nyateƒe réconcilie ces univers dans un langage clair, avec sources
                  affichées.
                </p>
                <ul className="space-y-2">
                  {[
                    'Corpus togolais et actes OHADA',
                    'Extraits cités, jamais masqués',
                    'Langage clair, références précises',
                  ].map((line) => (
                    <li key={line} className="flex items-center gap-2 font-body text-body-md text-on-surface">
                      <MaterialIcon name="check_circle" className="text-[18px] text-tertiary" />
                      {line}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </Reveal>

          <section className="w-full scroll-mt-24 bg-surface-container px-margin py-space-xl" id="textes-de-loi">
            <div className="mx-auto flex max-w-7xl flex-col gap-space-xl">
              <Reveal delayMs={0}>
                <div className="max-w-2xl">
                  <span className="font-label text-label-sm font-semibold uppercase tracking-widest text-primary-container">
                    Domaines d&apos;expertise
                  </span>
                  <h2 className="font-headline text-headline-lg text-primary">
                    Les piliers majeurs du droit togolais
                  </h2>
                  <p className="mt-space-sm font-body text-body-md text-on-surface-variant">
                    Interrogez un domaine : l&apos;assistant part des textes, pas d&apos;une opinion.
                  </p>
                </div>
              </Reveal>
              <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2 lg:grid-cols-3">
                {PILLARS.map((pillar, index) => (
                  <Reveal key={pillar.title} delayMs={index * 70} variant="scale">
                    <TiltCard>
                      <div className="card-lift flex h-full flex-col rounded-2xl bg-surface-container-lowest p-space-lg shadow-md hover:shadow-xl">
                        <div className="flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-primary-container">
                            <MaterialIcon name={pillar.icon} className="text-[26px]" />
                          </div>
                          <span className="rounded-full bg-surface-container-high px-2.5 py-1 font-label text-label-sm font-semibold text-primary-container">
                            {pillar.tag}
                          </span>
                        </div>
                        <h3 className="mt-space-md font-headline text-headline-sm text-primary">
                          {pillar.title}
                        </h3>
                        <p className="mt-2 flex-1 font-body text-body-sm text-on-surface-variant">
                          {pillar.text}
                        </p>
                        <button
                          type="button"
                          onClick={() => goToAssistant(pillar.query)}
                          className="mt-space-lg flex w-full items-center justify-center gap-1 rounded-lg bg-surface-container-high py-2.5 font-label text-label-md text-primary transition-colors hover:bg-primary-container hover:text-surface"
                        >
                          <span>Interroger ce domaine</span>
                          <MaterialIcon name="arrow_outward" className="text-[16px]" />
                        </button>
                      </div>
                    </TiltCard>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <Reveal as="section" id="profils" className="w-full scroll-mt-24 bg-surface-container-low px-margin py-space-xl">
            <div className="mx-auto max-w-7xl">
              <Reveal delayMs={0}>
                <span className="font-label text-label-sm font-semibold uppercase tracking-widest text-primary-container">
                  Publics visés
                </span>
                <h2 className="mt-space-xs font-headline text-headline-lg text-primary">
                  Pour qui est Nyateƒe ?
                </h2>
                <p className="mt-space-sm max-w-2xl font-body text-body-md text-on-surface-variant">
                  Commencer au Togo, construire pour l&apos;Afrique : une même plateforme
                  pour celles et ceux qui cherchent à comprendre le droit togolais.
                </p>
              </Reveal>
              <div className="mt-space-lg grid gap-space-lg sm:grid-cols-2">
                {LANDING_PUBLICS.map((profile, index) => (
                  <Reveal key={profile.title} delayMs={index * 80} variant={index % 2 === 0 ? 'left' : 'right'}>
                    <div className="card-lift flex h-full flex-col rounded-2xl bg-surface-container-lowest p-space-lg shadow-md">
                      <MaterialIcon name={profile.icon} className="text-[32px] text-primary-container" />
                      <h3 className="mt-space-sm font-headline text-headline-sm text-primary">
                        {profile.title}
                      </h3>
                      <p className="mt-2 flex-1 font-body text-body-sm text-on-surface-variant">
                        {profile.text}
                      </p>
                      <button
                        type="button"
                        onClick={() => onOpenAuth('signup', 'dashboard', profile.profile)}
                        className="mt-space-md w-full rounded-lg bg-surface-container-high py-2.5 font-label text-label-md text-primary transition-colors hover:bg-primary-container hover:text-surface"
                      >
                        Créer un compte
                      </button>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal as="section" id="faq" className="w-full scroll-mt-24 px-margin py-space-xl">
            <div className="mx-auto grid max-w-7xl gap-space-lg lg:grid-cols-12">
              <div className="lg:col-span-4">
                <span className="font-label text-label-sm font-semibold uppercase tracking-widest text-primary-container">
                  Questions fréquentes
                </span>
                <h2 className="mt-space-xs font-headline text-headline-lg text-primary">
                  Ce qu&apos;il faut savoir avant de commencer
                </h2>
                <p className="mt-space-sm font-body text-body-md text-on-surface-variant">
                  Transparence d&apos;usage, limites et méthode : les réponses utiles, sans détour.
                </p>
              </div>
              <div className="lg:col-span-8">
                <FaqList />
              </div>
            </div>
          </Reveal>

          <Reveal as="section" className="w-full px-margin pb-space-xl">
            <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-space-lg overflow-hidden rounded-2xl bg-primary p-space-lg text-surface shadow-xl lg:flex-row lg:p-space-xl">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-container/50 blur-2xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-20 left-20 h-48 w-48 rounded-full bg-secondary/40 blur-2xl"
                aria-hidden
              />
              <div className="relative max-w-2xl">
                <span className="font-label text-label-sm font-semibold uppercase tracking-widest text-primary-fixed-dim">
                  Extrait de corpus officiel
                </span>
                <h3 className="mt-2 font-headline text-headline-lg font-serif text-surface">
                  « Nul ne peut être contraint de céder sa propriété, si ce n&apos;est
                  pour cause d&apos;utilité publique... »
                </h3>
                <p className="mt-2 font-body text-body-md text-surface/90">
                  Constitution et Code foncier togolais. Nyateƒe relie chaque réponse aux
                  extraits officiels correspondants.
                </p>
              </div>
              <button
                type="button"
                onClick={() => goToAssistant(prompt || 'Quels sont mes droits en droit togolais ?')}
                className="btn-shine relative flex shrink-0 items-center justify-center gap-2 rounded-xl bg-surface px-space-lg py-3.5 font-label text-label-md text-primary transition-colors hover:bg-surface-variant"
              >
                <MaterialIcon name="search" className="text-[20px]" />
                Démarrer une recherche
              </button>
            </div>
          </Reveal>
        </main>
      </PageEnter>

      <LandingFooter onNavigate={onNavigate} onProfilsClick={goToProfils} />
    </div>
  )
}
