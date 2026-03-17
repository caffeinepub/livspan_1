import { type ReactNode, createContext, useContext, useState } from "react";

type Lang = "de" | "en";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({
  lang: "de",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("livspan-lang");
    return stored === "en" ? "en" : "de";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("livspan-lang", l);
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
