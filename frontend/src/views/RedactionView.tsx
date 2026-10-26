import { MaterialIcon } from '../components/shell/MaterialIcon'

export function RedactionView() {
  return (
    <div className="px-margin py-space-lg">
      <div className="max-w-3xl">
        <span className="font-label text-label-sm font-semibold uppercase tracking-widest text-primary-container">
          Espace professionnel
        </span>
        <h1 className="mt-1 font-headline text-headline-lg text-primary">
          Rédaction assistée
        </h1>
        <p className="mt-2 font-body text-body-md text-on-surface-variant">
          Préparez vos écritures de procédure (assignations, conclusions, requêtes)
          à partir de modèles et de sources officielles. L&apos;éditeur dédié arrive
          prochainement.
        </p>
      </div>

      <div className="mt-space-lg grid gap-gutter md:grid-cols-2">
        {[
          {
            icon: 'description',
            title: 'Modèles de procédure',
            text: 'Trames adaptées au droit togolais et à l’OHADA.',
          },
          {
            icon: 'fact_check',
            title: 'Vérification des citations',
            text: 'Reliez chaque argument aux articles cités dans Nyateƒe.',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-space-lg"
          >
            <MaterialIcon name={item.icon} className="text-[28px] text-primary-container" />
            <h2 className="mt-space-sm font-headline text-headline-sm text-primary">
              {item.title}
            </h2>
            <p className="mt-1 font-body text-body-sm text-on-surface-variant">{item.text}</p>
          </div>
        ))}
      </div>

      <p className="mt-space-lg rounded-xl bg-surface-container p-space-md font-body text-body-sm text-on-surface-variant">
        <MaterialIcon name="info" className="mr-1 align-middle text-[18px] text-primary" />
        En attendant l&apos;éditeur, utilisez l&apos;assistant juridique pour structurer vos
        arguments.
      </p>
    </div>
  )
}
