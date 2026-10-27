import type { PublicProfile } from './auth-types'

export type CitizenShortcut = {
  icon: string
  title: string
  hint: string
}

export function shortcutsForProfile(profile: PublicProfile): CitizenShortcut[] {
  if (profile === 'student') {
    return [
      {
        icon: 'menu_book',
        title: 'Quelle est la distinction entre contravention, délit et crime ?',
        hint: 'Droit pénal togolais',
      },
      {
        icon: 'account_balance',
        title: 'Quelles sont les formalités pour créer une SARL au CFE Lomé ?',
        hint: 'OHADA et sociétés',
      },
      {
        icon: 'family_restroom',
        title: 'Comment se déroule la succession selon le Code des personnes ?',
        hint: 'Famille et héritage',
      },
      {
        icon: 'gavel',
        title: "Dans quels cas l'État peut-il exproprier pour utilité publique ?",
        hint: 'Droit public',
      },
    ]
  }

  if (profile === 'enterprise') {
    return [
      {
        icon: 'corporate_fare',
        title: 'Quelles sont les formalités pour créer une SARL au CFE Lomé ?',
        hint: 'Création de société',
      },
      {
        icon: 'badge',
        title: 'Quelles sont les règles de licenciement selon le Code du travail ?',
        hint: 'Droit du travail',
      },
      {
        icon: 'handshake',
        title: 'Comment fonctionne une sûreté OHADA sur un fonds de commerce ?',
        hint: 'Sûretés et crédit',
      },
      {
        icon: 'home_work',
        title: "Quelles règles encadrent un bail commercial à Lomé ?",
        hint: 'Baux professionnels',
      },
    ]
  }

  return [
    {
      icon: 'foundation',
      title: "Quelles sont les conditions de validité d'une vente de terrain coutumier ?",
      hint: 'Foncier et coutume',
    },
    {
      icon: 'family_restroom',
      title: 'Comment se déroule la succession selon le Code des personnes ?',
      hint: 'Famille et héritage',
    },
    {
      icon: 'home_work',
      title: 'Un bailleur peut-il augmenter le loyer sans préavis ?',
      hint: 'Bail d\'habitation',
    },
    {
      icon: 'badge',
      title: 'Quelles sont les règles de la période d\'essai au Togo ?',
      hint: 'Code du travail',
    },
  ]
}

export const LIBRARY_SHORTCUTS = [
  'Code foncier et domanial',
  'Succession',
  'SARL OHADA',
  'Bail d\'habitation',
  'Licenciement',
  'Expropriation',
]
