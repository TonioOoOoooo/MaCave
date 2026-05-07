import { Moon, Sun } from "./icons";

type LayoutProps = {
  children: React.ReactNode;
  darkMode: boolean;
  onToggleDarkMode: () => void;
};

export function Layout({ children, darkMode, onToggleDarkMode }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-red-700 dark:text-red-300">Ma Cave</p>
            <h1 className="text-lg font-semibold leading-tight">Inventaire</h1>
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
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6">{children}</main>
    </div>
  );
}
