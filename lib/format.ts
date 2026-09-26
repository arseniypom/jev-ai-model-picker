import { DOMINATED_BY, type Model } from "@/lib/models"
import type { Dict } from "@/lib/i18n"
import type { ModelStatus } from "@/lib/select"

export const modelName = (m: Model) => `${m.family} ${m.effort}`

// Without the vendor prefix, for tight spots: "Opus 5.5 High", "Sol Max".
export const shortName = (m: Model) =>
  `${m.family.replace(/^(GPT-6|Claude) /, "")} ${m.effort}`

// Model prices are cents and up; a Jev call costs a fraction of a cent.
export const formatCost = (usd: number) =>
  `$${usd >= 0.01 ? usd.toFixed(2) : usd.toPrecision(1)}`

export const percent = (x: number) => `${Math.round(x * 100)}%`

export function statusText(model: Model, status: ModelStatus, t: Dict): string {
  switch (status) {
    case "chosen":
    case "overkill":
    case "insufficient":
      return t.status[status]
    case "dominated": {
      const better = DOMINATED_BY.get(model.id)
      return better ? t.status.dominatedBy(shortName(better)) : t.status.dominated
    }
  }
}
