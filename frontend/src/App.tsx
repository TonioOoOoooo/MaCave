import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { WineDetail } from "./pages/WineDetail";
import { WinesList } from "./pages/WinesList";

export function App() {
  const [selectedWineId, setSelectedWineId] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <Layout darkMode={darkMode} onToggleDarkMode={() => setDarkMode((value) => !value)}>
      {selectedWineId === null ? (
        <WinesList onSelectWine={setSelectedWineId} />
      ) : (
        <WineDetail wineId={selectedWineId} onBack={() => setSelectedWineId(null)} />
      )}
    </Layout>
  );
}
