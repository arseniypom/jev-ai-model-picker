import type { JevAnswers, ScoreAnswer, TaskType } from "@/lib/jev"
import { DOMINATED_BY, MODELS, type Model, type Provider } from "@/lib/models"

// Nothing can require more than the smartest model we have: the hardest tasks
// get the best one rather than nothing.
const TOP_INDEX = Math.max(...MODELS.map((m) => m.index))

// Minimum Intelligence Index a model needs for each `difficulty` level,
// from "trivial" to "frontier".
const LEVEL_BASE_INDEX = [29, 34, 40, 43, 51, 56]

// The factor questions nudge those requirements up or down. With every factor
// at its midpoint there is no shift; all factors at the extremes move the
// requirement by ±FACTOR_SPAN / 2 index points.
const FACTOR_WEIGHTS = {
  reasoning: 0.35,
  expertise: 0.25,
  precision: 0.25,
  scope: 0.15,
} as const
const FACTOR_SPAN = 6
const NOVEL_BUMP = 2
const MAX_SHIFT = 4

// Pick the cheapest model whose chance of being smart enough, under Jev's
// distribution over difficulty levels, is at least this.
const SUFFICIENCY_THRESHOLD = 0.8
const EPSILON = 1e-9

export type ProviderFilter = Provider | "any"
export type Factor = keyof typeof FACTOR_WEIGHTS
export type ModelStatus = "chosen" | "insufficient" | "overkill" | "dominated"

export interface Pick {
  id: string
  sufficiency: number
}

export interface PickResult {
  pick: Pick
  alternative: Pick | null
  models: Array<Pick & { status: ModelStatus }>
  analysis: {
    level: number
    confidence: number
    requiredIndex: number
    taskType: TaskType
    factors: Array<{ id: Factor; value: number }>
    novel: number
    isTask: number
  }
  meta: {
    jevModel: string
    cost: number
    latencyMs: number
    truncated: boolean
    omittedChars: number
  }
}

function levels(answer: ScoreAnswer): number[] {
  const count = Object.keys(answer.probabilities).length
  return Array.from({ length: count }, (_, k) => answer.probabilities[k] ?? 0)
}

function normalized(answer: ScoreAnswer): number {
  const top = Object.keys(answer.probabilities).length - 1
  return top > 0 ? answer.score / top : 0
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

function requirementShift(answers: JevAnswers): number {
  let shift = 0
  for (const [id, weight] of Object.entries(FACTOR_WEIGHTS)) {
    shift += weight * (normalized(answers[id as Factor]) - 0.5) * FACTOR_SPAN
  }
  // Only a confident "novel" pushes the requirement up.
  shift += NOVEL_BUMP * clamp((answers.novel.noul - 0.5) * 2, 0, 1)
  return clamp(shift, -MAX_SHIFT, MAX_SHIFT)
}

// The lowest index that reaches the sufficiency threshold: the same bar the
// pick is held to, so "needed" and "chosen" always agree.
function requiredAtThreshold(probs: number[], required: number[]): number {
  let covered = 0
  for (let k = 0; k < probs.length; k++) {
    covered += probs[k]
    if (covered >= SUFFICIENCY_THRESHOLD - EPSILON) return Math.ceil(required[k])
  }
  return Math.ceil(required[required.length - 1])
}

function choose(candidates: Array<Model & { sufficiency: number }>) {
  const sufficient = candidates
    .filter((m) => m.sufficiency >= SUFFICIENCY_THRESHOLD - EPSILON)
    .sort((a, b) => a.cost - b.cost || b.index - a.index)
  if (sufficient.length) return sufficient[0]
  // Nothing clears the bar (e.g. only the other provider's models): take the
  // one that covers the most, and the smartest among equals.
  return [...candidates].sort(
    (a, b) => b.sufficiency - a.sufficiency || b.index - a.index || a.cost - b.cost
  )[0]
}

export function selectModel(
  answers: JevAnswers,
  meta: PickResult["meta"],
  provider: ProviderFilter = "any"
): PickResult {
  const difficulty = answers.difficulty
  const probs = levels(difficulty)
  const shift = requirementShift(answers)
  const required = probs.map((_, k) =>
    Math.min(LEVEL_BASE_INDEX[k] + shift, TOP_INDEX)
  )

  const scored = MODELS.map((m) => ({
    ...m,
    sufficiency: probs.reduce(
      (sum, p, k) => sum + (m.index >= required[k] ? p : 0),
      0
    ),
  }))

  const pick = choose(
    provider === "any" ? scored : scored.filter((m) => m.provider === provider)
  )
  // Offer the other provider only when the user didn't pin one.
  const alternative =
    provider === "any"
      ? choose(scored.filter((m) => m.provider !== pick.provider))
      : null

  const status = (m: (typeof scored)[number]): ModelStatus => {
    if (m.id === pick.id) return "chosen"
    if (DOMINATED_BY.has(m.id)) return "dominated"
    return m.sufficiency >= SUFFICIENCY_THRESHOLD - EPSILON ? "overkill" : "insufficient"
  }

  const level = difficulty.score

  return {
    pick: { id: pick.id, sufficiency: pick.sufficiency },
    alternative: alternative
      ? { id: alternative.id, sufficiency: alternative.sufficiency }
      : null,
    models: scored.map((m) => ({
      id: m.id,
      sufficiency: m.sufficiency,
      status: status(m),
    })),
    analysis: {
      level,
      confidence: difficulty.confidence,
      requiredIndex: requiredAtThreshold(probs, required),
      taskType: answers.task_type.choice,
      factors: (Object.keys(FACTOR_WEIGHTS) as Factor[]).map((id) => ({
        id,
        value: normalized(answers[id]),
      })),
      novel: answers.novel.noul,
      isTask: answers.is_task.noul,
    },
    meta,
  }
}
