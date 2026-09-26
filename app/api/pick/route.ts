import { askJev, JevError } from "@/lib/jev"
import { DEFAULT_LANG, DICT, isLang } from "@/lib/i18n"
import { selectModel, type ProviderFilter } from "@/lib/select"

export const maxDuration = 30

const MAX_PROMPT_CHARS = 1_000_000

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : ""
  const provider: ProviderFilter =
    body?.provider === "openai" || body?.provider === "anthropic" ? body.provider : "any"
  const lang: unknown = body?.lang
  const t = DICT[isLang(lang) ? lang : DEFAULT_LANG].api

  if (!prompt) {
    return Response.json({ error: t.emptyPrompt }, { status: 400 })
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return Response.json({ error: t.promptTooLong }, { status: 413 })
  }

  try {
    const jev = await askJev(prompt)
    return Response.json(
      selectModel(jev.answers, {
        jevModel: jev.model,
        cost: jev.cost,
        latencyMs: jev.latencyMs,
        truncated: jev.truncated,
        omittedChars: jev.omittedChars,
      }, provider)
    )
  } catch (err) {
    if (err instanceof JevError) {
      const error = err.detail ? `Jev: ${err.detail}` : t.jev[err.code]
      return Response.json({ error }, { status: err.status })
    }
    console.error(err)
    return Response.json({ error: t.internal }, { status: 500 })
  }
}
