export function LayoutHeader() {
  return (
    <header className="border-b border-sky-900/10 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-700 to-sky-900 text-lg font-bold text-amber-300 shadow-lg shadow-sky-900/20">
            N
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-sky-950">
              Nyateƒe
            </p>
            <p className="text-xs text-slate-600 sm:text-sm">
              IA juridique pour le droit togolais
            </p>
          </div>
        </div>
        <p className="hidden text-right text-xs text-slate-500 sm:block">
          Commencer au Togo,
          <br />
          construire pour l&apos;Afrique
        </p>
      </div>
    </header>
  )
}
