"use client"

import { useRef, useState } from "react"
import { LangSwitch, useLang } from "@/components/lang"
import { PromptBox } from "@/components/prompt-box"
import { Result, ResultSkeleton } from "@/components/result"
import type { PickResult, ProviderFilter } from "@/lib/select"
import { cn } from "@/lib/utils"

const PROVIDERS: Array<{ value: ProviderFilter; label?: string }> = [
  { value: "any" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
]

export function Picker() {
  const { lang, t } = useLang()
  const [prompt, setPrompt] = useState("")
  const [result, setResult] = useState<PickResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<ProviderFilter>("any")
  const request = useRef<AbortController | null>(null)

  async function submit() {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, provider, lang }),
        signal: controller.signal,
      })
      const body = await res.json().catch(() => null)
      if (res.status === 429 && !body?.error) {
        throw new Error(t.tooManyRequests)
      }
      if (!res.ok) throw new Error(body?.error ?? t.httpError(res.status))
      setResult(body as PickResult)
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err instanceof Error ? err.message : t.pickFailed)
    } finally {
      if (request.current === controller) setLoading(false)
    }
  }

  const settled = result !== null || loading

  return (
    <main className="relative flex min-h-dvh flex-col px-4 sm:px-6">
      <LangSwitch className="absolute top-4 right-4 sm:top-6 sm:right-6" />

      {/* Holds the composer at the optical center until there is a result. */}
      <div
        className={cn(
          "shrink-0 transition-[flex-grow] duration-500 ease-out motion-reduce:transition-none",
          settled ? "grow-0 basis-12 sm:basis-20" : "grow basis-12"
        )}
      />

      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-[2.75rem]">
          {t.title}
        </h1>
        <p className="mt-3 max-w-[58ch] text-base text-muted-foreground">
          {t.subtitle}
        </p>

        <div className="mt-8">
          <PromptBox value={prompt} onChange={setPrompt} onSubmit={submit} loading={loading} />
        </div>

        <div className="mt-3 flex items-center gap-3 text-sm">
          <span id="provider-label" className="text-muted-foreground">{t.provider}</span>
          <div
            role="radiogroup"
            aria-labelledby="provider-label"
            className="inline-flex rounded-lg border bg-card p-0.5"
          >
            {PROVIDERS.map((p) => (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={provider === p.value}
                onClick={() => setProvider(p.value)}
                className={cn(
                  "rounded-md px-3 py-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  provider === p.value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label ?? t.anyProvider}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}


        {settled && (
          <div className="mt-12 pb-16">
            {loading ? <ResultSkeleton /> : result && <Result result={result} />}
          </div>
        )}
      </div>

      <div className={cn("shrink-0", settled ? "grow-0" : "grow-[1.4] basis-12")} />
    </main>
  )
}
