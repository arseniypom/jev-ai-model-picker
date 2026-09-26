"use client"

import { createContext, useContext, useState } from "react"
import { DICT, LANGS, LANG_COOKIE, type Lang } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void } | null>(null)

export function LangProvider({ initial, children }: { initial: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState(initial)

  function setLang(next: Lang) {
    setLangState(next)
    // The cookie lets the server render the chosen language on the next visit.
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = next
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error("useLang must be used inside LangProvider")
  return { ...ctx, t: DICT[ctx.lang] }
}

export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useLang()
  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className={cn("inline-flex rounded-lg border bg-card p-0.5 text-xs", className)}
    >
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          lang={l}
          aria-checked={lang === l}
          onClick={() => setLang(l)}
          className={cn(
            "rounded-md px-2.5 py-1 font-medium uppercase transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            lang === l ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
