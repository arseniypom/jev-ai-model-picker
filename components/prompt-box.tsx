"use client"

import { useLayoutEffect, useRef, useSyncExternalStore } from "react"
import { Loader2 } from "lucide-react"
import { useLang } from "@/components/lang"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Grows with the text up to 45% of the viewport, then scrolls inside.
const MAX_HEIGHT_VH = 0.45
const MIN_HEIGHT_PX = 120

const noop = () => () => {}
const useIsMac = () =>
  useSyncExternalStore(
    noop,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => true
  )

export function PromptBox({
  value,
  onChange,
  onSubmit,
  loading,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  loading: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const isMac = useIsMac()
  const { t } = useLang()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const resize = () => {
      el.style.height = "auto"
      const max = Math.max(MIN_HEIGHT_PX, window.innerHeight * MAX_HEIGHT_VH)
      el.style.height = `${Math.min(Math.max(el.scrollHeight, MIN_HEIGHT_PX), max)}px`
    }
    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [value])

  const empty = !value.trim()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!empty && !loading) onSubmit()
      }}
      className={cn(
        "rounded-2xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors",
        "focus-within:border-ring/70 dark:shadow-none"
      )}
    >
      <label htmlFor="prompt" className="sr-only">
        {t.promptLabel}
      </label>
      <textarea
        id="prompt"
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            if (!empty && !loading) onSubmit()
          }
        }}
        placeholder={t.placeholder}
        spellCheck={false}
        className="block w-full resize-none bg-transparent px-4 pt-4 pb-2 text-base leading-relaxed outline-none placeholder:text-muted-foreground/80"
      />
      <div className="flex items-center justify-between gap-3 px-3 pb-3 pl-4">
        <span className="text-sm text-muted-foreground tabular-nums">
          {value.length > 0 ? t.chars(value.length.toLocaleString(t.locale)) : ""}
        </span>
        <div className="flex items-center gap-3">
          <kbd className="hidden font-sans text-xs text-muted-foreground sm:inline">
            {isMac ? "⌘" : "Ctrl"} Enter
          </kbd>
          <Button type="submit" size="lg" disabled={empty || loading} className="h-9 px-4">
            {loading && <Loader2 className="animate-spin" />}
            {t.submit}
          </Button>
        </div>
      </div>
    </form>
  )
}
