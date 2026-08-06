import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { COPY, type Copy, type Lang } from './copy'

type Value = { lang: Lang; copy: Copy; setLang: (l: Lang) => void }

const LangContext = createContext<Value | null>(null)

/** Language lives above the router, so it survives a move to the dashboard. */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ru')
  const copy = COPY[lang]

  useEffect(() => {
    document.documentElement.lang = copy.htmlLang
  }, [copy])

  const value = useMemo(() => ({ lang, copy, setLang }), [lang, copy])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): Value {
  const value = useContext(LangContext)
  if (!value) throw new Error('useLang must be used inside LangProvider')
  return value
}
