// Artificial Analysis Intelligence Index v4.3.2 and the average cost of one
// benchmark task (USD). Cost per task, not per token: reasoning effort changes
// how many tokens a model spends, so this is the fair price comparison.

export type Provider = "openai" | "anthropic"
export type Effort = "Low" | "Medium" | "High" | "XHigh" | "Max"

export interface Model {
  id: string
  provider: Provider
  family: string
  effort: Effort
  index: number
  cost: number
}

export interface Family {
  name: string
  provider: Provider
  models: Model[]
}

type Variant = [effort: Effort, index: number, cost: number]

function family(name: string, provider: Provider, variants: Variant[]): Family {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return {
    name,
    provider,
    models: variants.map(([effort, index, cost]) => ({
      id: `${slug}-${effort.toLowerCase()}`,
      provider,
      family: name,
      effort,
      index,
      cost,
    })),
  }
}

export const FAMILIES: Family[] = [
  family("GPT-6 Luna", "openai", [
    ["Medium", 29, 0.02],
    ["High", 32, 0.03],
    ["XHigh", 34, 0.04],
    ["Max", 37, 0.07],
  ]),
  family("GPT-6 Sol", "openai", [
    ["Low", 34, 0.13],
    ["Medium", 40, 0.25],
    ["High", 43, 0.37],
    ["XHigh", 44, 0.53],
    ["Max", 48, 1.06],
  ]),
  family("GPT-6 Astra", "openai", [
    ["Low", 46, 0.82],
    ["Medium", 50, 1.54],
    ["High", 51, 1.73],
    ["XHigh", 52, 2.31],
    ["Max", 53, 3.26],
  ]),
  family("Claude Opus 5.5", "anthropic", [
    ["Low", 42, 0.55],
    ["Medium", 51, 1.34],
    ["High", 54, 1.82],
    ["XHigh", 56, 3.46],
    ["Max", 58, 5.98],
  ]),
  family("Claude Sonnet 5", "anthropic", [
    ["Low", 24, 0.51],
    ["Medium", 28, 1.0],
    ["High", 32, 1.79],
    ["XHigh", 34, 2.87],
    ["Max", 38, 5.09],
  ]),
  family("Claude Fable 5.1", "anthropic", [
    ["Low", 47, 2.37],
    ["Medium", 49, 2.98],
    ["High", 51, 3.91],
    ["XHigh", 53, 5.98],
    ["Max", 53, 7.63],
  ]),
  family("Claude Opus 5", "anthropic", [["Max", 51, 5.86]]),
]

export const MODELS: Model[] = FAMILIES.flatMap((f) => f.models)

const byId = new Map(MODELS.map((m) => [m.id, m]))

export function getModel(id: string): Model {
  const model = byId.get(id)
  if (!model) throw new Error(`Unknown model: ${id}`)
  return model
}

export const PROVIDER_NAME: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
}

// A model is dominated when another one is at least as smart and no more
// expensive, and strictly better on one of the two. It never wins a pick.
export const DOMINATED_BY: Map<string, Model> = new Map(
  MODELS.flatMap((m) => {
    const better = MODELS.filter(
      (o) =>
        o.index >= m.index &&
        o.cost <= m.cost &&
        (o.index > m.index || o.cost < m.cost)
    ).sort((a, b) => a.cost - b.cost)[0]
    return better ? [[m.id, better] as const] : []
  })
)
