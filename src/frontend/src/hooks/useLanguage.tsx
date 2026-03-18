import { type ReactNode, createContext, useContext, useState } from "react";

type Lang = "en" | "de" | "ru";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("livspan_lang");
    if (stored === "de" || stored === "ru") return stored;
    return "en";
  });

  const setLang = (l: Lang) => {
    localStorage.setItem("livspan_lang", l);
    setLangState(l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LangContext);
}
