import { Moon, Search, Sun } from "./icons";

type LayoutProps = {
  children: React.ReactNode;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentView: "dashboard" | "wines";
  onNavigate: (view: "dashboard" | "wines") => void;
  title: string;
};

const navItems = [
  { id: "dashboard", label: "Accueil" },
  { id: "wines", label: "Mes vins" },
  { id: "entries", label: "Mes entrées" },
  { id: "outputs", label: "Mes sorties" },
  { id: "tastings", label: "Dégustations" },
  { id: "pairings", label: "Accords Mets & Vins" },
  { id: "stats", label: "Statistiques" }
] as const;

export function Layout({ children, darkMode, onToggleDarkMode, currentView, onNavigate, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100 lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto px-4 py-5">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">MC</div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ma cave</p>
              <p className="font-semibold">MaCave</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = item.id === currentView;
              const enabled = item.id === "dashboard" || item.id === "wines";
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!enabled}
                  onClick={() => enabled && onNavigate(item.id)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
                    active
                      ? "bg-slate-100 font-semibold text-slate-950 dark:bg-slate-900 dark:text-white"
                      : "text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-900"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${active ? "bg-red-700" : "bg-slate-300 dark:bg-slate-700"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-red-700 dark:text-red-300">Ma Cave</p>
              <h1 className="text-lg font-semibold leading-tight">{title}</h1>
            </div>
            <div className="hidden min-w-0 max-w-sm flex-1 items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900 sm:flex">
              <Search className="h-4 w-4 text-slate-400" />
              <input className="ml-2 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Rechercher dans ma cave" />
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
              title={darkMode ? "Mode clair" : "Mode sombre"}
            >
              {darkMode ? <Sun /> : <Moon />}
            </button>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 dark:border-slate-900 lg:hidden">
            <button
              type="button"
              onClick={() => onNavigate("dashboard")}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${currentView === "dashboard" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}
            >
              Accueil
            </button>
            <button
              type="button"
              onClick={() => onNavigate("wines")}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${currentView === "wines" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}
            >
              Mes vins
            </button>
          </nav>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
