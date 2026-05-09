import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { WineDetail } from "./pages/WineDetail";
import { WinesList } from "./pages/WinesList";

type WinesInitial = { search?: string; phase?: string };

export function App() {
  const [selectedWineId, setSelectedWineId] = useState<number | null>(null);
  const [view, setView] = useState<"dashboard" | "wines">("dashboard");
  const [winesInitial, setWinesInitial] = useState<WinesInitial>({});
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  function openWines(initial?: WinesInitial) {
    setWinesInitial(initial ?? {});
    setSelectedWineId(null);
    setView("wines");
  }

  return (
    <Layout
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode((value) => !value)}
      currentView={view}
      title={selectedWineId === null ? (view === "dashboard" ? "Accueil" : "Mes vins") : "Fiche vin"}
      onNavigate={(nextView) => {
        setSelectedWineId(null);
        setView(nextView);
      }}
    >
      {selectedWineId !== null ? (
        <WineDetail wineId={selectedWineId} onBack={() => setSelectedWineId(null)} />
      ) : view === "dashboard" ? (
        <Dashboard onSelectWine={setSelectedWineId} onOpenWines={openWines} />
      ) : (
        <WinesList onSelectWine={setSelectedWineId} initialSearch={winesInitial.search} initialPhase={winesInitial.phase} />
      )}
    </Layout>
  );
}
