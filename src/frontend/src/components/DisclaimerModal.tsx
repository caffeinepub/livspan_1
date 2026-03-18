import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";

const DISCLAIMER_KEY = "livspan_disclaimer_accepted";

export function useDisclaimer() {
  const [accepted, setAccepted] = useState(() => {
    return localStorage.getItem(DISCLAIMER_KEY) === "true";
  });

  const accept = () => {
    localStorage.setItem(DISCLAIMER_KEY, "true");
    setAccepted(true);
  };

  return { accepted, accept };
}

const texts: Record<string, { title: string; body: string[]; button: string }> =
  {
    en: {
      title: "Important Disclaimer",
      body: [
        "LivSpan is a personal health tracking tool designed for informational and motivational purposes only.",
        "It is not a medical device and does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making changes to your health, diet, or fitness routine.",
        "LivSpan is not liable for any decisions made based on data or suggestions shown in this app.",
        "Your health data is stored on the Internet Computer blockchain (ICP) in a decentralized and pseudonymous manner.",
        "LIV tokens have no guaranteed monetary value and are not a financial instrument.",
      ],
      button: "I understand and agree",
    },
    de: {
      title: "Wichtiger Haftungsausschluss",
      body: [
        "LivSpan ist ein persönliches Gesundheitstracking-Tool, das ausschließlich zu Informations- und Motivationszwecken dient.",
        "Es ist kein Medizinprodukt und ersetzt keine ärztliche Beratung, Diagnose oder Behandlung. Konsultiere immer einen qualifizierten Arzt, bevor du Änderungen an deiner Gesundheit, Ernährung oder deinem Training vornimmst.",
        "LivSpan haftet nicht für Entscheidungen, die auf Basis der in dieser App angezeigten Daten oder Vorschläge getroffen werden.",
        "Deine Gesundheitsdaten werden dezentral und pseudonym auf der Internet Computer Blockchain (ICP) gespeichert.",
        "LIV-Token haben keinen garantierten Geldwert und sind kein Finanzinstrument.",
      ],
      button: "Ich verstehe und stimme zu",
    },
  };

const fallback = texts.en;

export default function DisclaimerModal({
  onAccept,
}: { onAccept: () => void }) {
  const { lang: language } = useLanguage();
  const t = texts[language] ?? fallback;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <img
            src="/assets/uploads/IMG_8398-1.png"
            alt="LivSpan"
            className="w-9 h-9 object-contain"
          />
          <h2 className="text-lg font-bold text-foreground">{t.title}</h2>
        </div>
        <div className="flex flex-col gap-3">
          {t.body.map((para) => (
            <p
              key={para.slice(0, 20)}
              className="text-sm text-muted-foreground leading-relaxed"
            >
              {para}
            </p>
          ))}
        </div>
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
          onClick={onAccept}
        >
          {t.button}
        </Button>
      </div>
    </div>
  );
}
