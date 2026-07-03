'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { translations, type Translation } from './translations'
import type { Language } from '@/types'

interface LangCtx {
  lang: Language
  setLang: (l: Language) => void
  t: Translation
}

const LanguageContext = createContext<LangCtx>({
  lang: 'tr',
  setLang: () => {},
  t: translations.tr,
})

export function LanguageProvider({
  children,
  initialLang = 'tr',
}: {
  children: React.ReactNode
  initialLang?: Language
}) {
  const [lang, setLangState] = useState<Language>(initialLang)

  const setLang = useCallback((newLang: Language) => {
    document.cookie = `lang=${newLang};path=/;max-age=31536000;SameSite=Lax`
    setLangState(newLang)
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
