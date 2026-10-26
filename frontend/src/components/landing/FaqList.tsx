import { useState } from 'react'

import { MaterialIcon } from '../shell/MaterialIcon'

const FAQ_ITEMS = [
  {
    q: 'Nyateƒe remplace-t-il un avocat ?',
    a: 'Non. Nyateƒe clarifie les textes et affiche les sources. Pour un conseil personnalisé ou une représentation, consultez un avocat inscrit au Barreau de Lomé.',
  },
  {
    q: 'D\'où viennent les réponses ?',
    a: 'Chaque réponse s\'appuie sur les textes officiels enregistrés dans Nyateƒe : lois, codes, décrets et extraits du Journal officiel.',
  },
  {
    q: 'Le droit coutumier est-il pris en compte ?',
    a: 'Oui. Le droit togolais articule droit écrit, OHADA et coutumes reconnues. Nyateƒe signale ces strates lorsque les sources le permettent.',
  },
  {
    q: 'Qui peut utiliser la plateforme ?',
    a: 'Citoyens, étudiants, entreprises et juristes. Un compte permet de suivre vos recherches et d\'accéder à l\'assistant.',
  },
  {
    q: 'Comment poser une bonne question ?',
    a: 'Décrivez les faits, le lieu (Togo) et ce que vous cherchez : procédure, délai ou conditions. Plus la question est précise, plus les sources sont pertinentes.',
  },
]

export function FaqList() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="divide-y divide-outline-variant/30 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-md">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index
        return (
          <div key={item.q}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-container-low"
            >
              <span className="font-headline text-headline-sm text-primary">{item.q}</span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary-container transition-transform duration-300 ${
                  isOpen ? 'rotate-45' : ''
                }`}
              >
                <MaterialIcon name="add" className="text-[20px]" />
              </span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 font-body text-body-md text-on-surface-variant">{item.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
