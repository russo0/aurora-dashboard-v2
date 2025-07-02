import React, { useState, useEffect } from "react";
import "./i18n";
import { useTranslation } from "react-i18next";
import DataCard from "./components/DataCard";
import BzChart from "./components/BzChart";
import { playAlertSound } from "./utils/alertSound";

const DEMO_DATA = {
  bz: -3.4,
  wind: 520,
  kp: 4.7,
  time: new Date().toLocaleTimeString(),
  bzHistory: Array.from({length: 13}, (_, i) => ({
    time: `${(new Date(Date.now() - (12 - i) * 30 * 60 * 1000)).getHours()}h`,
    bz: Math.round((Math.random() * 16 - 8) * 10) / 10 // -8 to +8
  })),
};

const PROXY_URL = "https://proxy-noaa.russosec.workers.dev/"; // Troque se quiser

function getChance(bz, wind, kp) {
  if (bz < -2 && wind > 400 && kp >= 4) return "High";
  if (bz < -2 && wind > 400) return "Moderate";
  return "Low";
}

function getColor(type, value) {
  if (type === "bz") return value < -2 ? "#32FF8F" : "#FFF";
  if (type === "wind") return value > 400 ? "#32FF8F" : "#FFF";
  if (type === "kp") {
    if (value >= 6) return "#FF3232";
    if (value >= 4) return "#FFD700";
    return "#32FF8F";
  }
  return "#32FF8F";
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(DEMO_DATA);
  const [mode, setMode] = useState("demo");
  const [alerted, setAlerted] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch real data
  useEffect(() => {
    let interval;
    if (mode === "live") {
      const fetchData = async () => {
        try {
          const resp = await fetch(PROXY_URL);
          const json = await resp.json();

          // Ajuste conforme resposta da sua API real!
          const bz = parseFloat(json.bz ?? DEMO_DATA.bz);
          const wind = parseFloat(json.wind ?? DEMO_DATA.wind);
          const kp = parseFloat(json.kp ?? DEMO_DATA.kp);
          const bzHistory = json.bzHistory ?? DEMO_DATA.bzHistory;

          setData({ bz, wind, kp, bzHistory, time: new Date().toLocaleTimeString() });
          setLastUpdate(new Date().toLocaleTimeString());
        } catch (e) {
          // Fallback para demo data
          setData(DEMO_DATA);
        }
      };
      fetchData();
      interval = setInterval(fetchData, 60 * 1000); // Atualiza cada 1min
    } else {
      setData(DEMO_DATA);
    }
    return () => clearInterval(interval);
  }, [mode]);

  // Alerta visual/sonoro
  useEffect(() => {
    const highAlert = data.bz < -2 && data.wind > 400;
    if (highAlert && !alerted) {
      playAlertSound();
      setAlerted(true);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Aurora Substorm Monitor", {
          body: t("Alert! High chance of substorm!"),
        });
      }
    }
    if (!highAlert && alerted) setAlerted(false);
  }, [data, t, alerted]);

  // Pede permissão para push na primeira render
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-2 pb-10" style={{
      background: "radial-gradient(ellipse at 50% 10%, #183153 0%, #0B1C24 100%)",
    }}>
      <div className="w-full max-w-2xl pt-8 flex flex-col items-center">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-auroraGreen to-auroraPurple bg-clip-text text-transparent select-none">{t("Aurora Substorm Monitor")}</h1>
        <div className="flex gap-2 mb-6">
          <button
            className="text-sm bg-[#161f27] hover:bg-auroraPurple hover:text-white rounded-lg px-3 py-1"
            onClick={() => i18n.changeLanguage(i18n.language === "en" ? "pt" : "en")}
          >
            {t("Switch Language")}
          </button>
          <button
            className={`text-sm bg-[#161f27] hover:bg-auroraGreen hover:text-black rounded-lg px-3 py-1`}
            onClick={() => setMode(mode === "demo" ? "live" : "demo")}
          >
            {t("Data Mode")}: {mode === "demo" ? t("Demo") : t("Live")}
          </button>
        </div>
        {/* Painel de dados */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <DataCard
            title={t("BZ")}
            value={data.bz}
            unit="nT"
            color={getColor("bz", data.bz)}
          />
          <DataCard
            title={t("Solar Wind")}
            value={data.wind}
            unit="km/s"
            color={getColor("wind", data.wind)}
          />
          <DataCard
            title={t("Kp Index")}
            value={data.kp}
            unit=""
            color={getColor("kp", data.kp)}
          />
        </div>
        {/* Alerta visual */}
        {(data.bz < -2 && data.wind > 400) && (
          <div className="w-full flex flex-col items-center bg-auroraPurple/80 rounded-xl p-4 mb-2 animate-pulse shadow-lg">
            <div className="text-xl font-bold tracking-wider">{t("ALERT!")}</div>
            <div className="font-medium">{t("Alert! High chance of substorm!")}</div>
          </div>
        )}
        {/* Chance */}
        <div className="mb-3 text-lg flex gap-2 items-center">
          <span className="opacity-70">{t("Chance of Substorm")}:</span>
          <span className="font-semibold text-xl" style={{
            color: data.bz < -2 && data.wind > 400 && data.kp >= 4 ? "#FFD700" : (data.bz < -2 && data.wind > 400 ? "#32FF8F" : "#FFF")
          }}>
            {t(getChance(data.bz, data.wind, data.kp))}
          </span>
        </div>
        {/* Gráfico Bz */}
        <BzChart data={data.bzHistory} />
        {/* Última atualização */}
        <div className="mt-2 text-xs opacity-60">{t("Last update")}: {lastUpdate ?? "--"}</div>
      </div>
    </div>
  );
}
