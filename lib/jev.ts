import "server-only"
import type { JevErrorCode } from "@/lib/i18n"

// Jev (TypeSafe System One) via the OpenRouter Decisions API.
// Jev answers typed questions about a state with probabilities; it does not
// generate text. We ask it to judge the prompt, and leave the economics to code.
// https://openrouter.ai/docs/guides/community/jev

const ENDPOINT = "https://openrouter.ai/api/alpha/decisions"
export const JEV_MODEL = "typesafe/jev-1.13"

// Jev has a 32k token context. Very long prompts keep their head and tail,
// which is where the actual request usually lives. 48k characters of
// token-dense text (logs, code) is ~15k tokens, well inside the window.
const MAX_STATE_CHARS = 48_000
const HEAD_CHARS = 34_000
const TAIL_CHARS = 14_000

export const QUESTIONS = {
  difficulty: {
    type: "score",
    instructions:
      "How difficult is the task in `prompt` for an AI assistant to complete excellently? Judge the work the request demands, not how long the prompt is.",
    criteria: [
      "Trivial: small talk, a greeting, a one-line factual question, or a tiny edit. Any basic assistant gets it right.",
      "Routine: an everyday task such as a short summary, a casual email, translating a paragraph, a simple explanation, or a tiny script.",
      "Standard professional work: a structured document, a typical coding function or bug fix, a multi-step explanation or comparison that needs solid competence.",
      "Demanding: several interacting constraints, such as a non-trivial algorithm or refactor, debugging with limited clues, detailed technical or business analysis, or careful long-form writing.",
      "Expert-level: work that would take a strong professional hours, such as complex system design, advanced math or science problems, rigorous legal, medical or financial analysis, or large codebase changes.",
      "Frontier: at the edge of what the best AI systems can do, such as olympiad or research-grade proofs, open research questions, or very large autonomous engineering work where subtle mistakes are likely.",
    ],
  },
  reasoning: {
    type: "score",
    instructions:
      "How much step-by-step reasoning is needed to produce a correct answer to `prompt`?",
    criteria: [
      "None: the answer is recalled or restated directly, with no reasoning steps.",
      "A couple of obvious steps, like reformatting, summarizing, or applying one simple rule.",
      "Several steps that must be planned and checked, like a typical coding task or a comparison of options.",
      "Long chains of reasoning where intermediate results must be tracked and verified, like tricky debugging, multi-constraint planning, or multi-step math.",
      "Deep, extended reasoning that explores many possibilities, like hard proofs, novel algorithms, or intricate system trade-offs.",
    ],
  },
  expertise: {
    type: "score",
    instructions: "What level of specialist knowledge does `prompt` require?",
    criteria: [
      "Everyday knowledge that any adult has.",
      "General knowledge of an educated person or a hobbyist.",
      "Working professional knowledge in a field, like a practicing software engineer, marketer, or accountant.",
      "Deep specialist knowledge, like a senior expert in a technical, scientific, legal, or medical niche.",
      "Cutting-edge research knowledge that only leading experts in the field have.",
    ],
  },
  precision: {
    type: "score",
    instructions:
      "How costly would a subtle mistake in the answer to `prompt` be?",
    criteria: [
      "Harmless: a casual or creative request with many acceptable answers.",
      "Minor: mistakes are easy to spot and fix, like a draft text or a quick explanation.",
      "Significant: mistakes cause real rework, like production code, business documents, or data analysis.",
      "Severe: the answer must be exactly right and errors are hard to detect, like proofs, security, concurrency, or legal, medical, or financial conclusions.",
    ],
  },
  scope: {
    type: "score",
    instructions: "How large is the output that `prompt` asks for?",
    criteria: [
      "A word, a number, or a single sentence.",
      "A short paragraph or a few lines of code.",
      "About a page of text or a small self-contained piece of code.",
      "A long multi-section document or a complete program or module.",
      "A large multi-part deliverable, like a multi-file project, a full report, or a book chapter.",
    ],
  },
  task_type: {
    type: "choice",
    instructions: "What kind of task does `prompt` ask for?",
    criteria: {
      coding: "Writing, reviewing, debugging, or explaining code and software systems.",
      math: "Mathematics, logic puzzles, proofs, or quantitative problem solving.",
      analysis: "Analyzing data, documents, arguments, or decisions and drawing conclusions.",
      writing: "Creating original text: articles, emails, stories, marketing copy.",
      transform: "Transforming given text without adding much: translation, summarization, extraction, reformatting.",
      knowledge: "Answering factual or explanatory questions from general or domain knowledge.",
      planning: "Planning, strategy, or designing a process, product, or system.",
      chat: "Small talk, greetings, or casual conversation.",
      other: "None of the above.",
    },
  },
  novel: {
    type: "noul",
    instructions:
      "Does `prompt` require solving a novel problem that has no standard, well-known solution?",
    criteria: {
      true: "The task needs original problem solving, new ideas, or research beyond known methods.",
      false: "The task can be done with standard, well-known approaches.",
    },
  },
  is_task: {
    type: "noul",
    instructions: "Is `prompt` a meaningful request or task for an AI assistant?",
    criteria: {
      true: "It asks the assistant to do, answer, or produce something, even casually.",
      false: "It is random characters, an empty fragment, or text with no discernible request.",
    },
  },
} as const

type Questions = typeof QUESTIONS
export type ScoreId = {
  [K in keyof Questions]: Questions[K]["type"] extends "score" ? K : never
}[keyof Questions]
export type TaskType = keyof Questions["task_type"]["criteria"]

export interface ScoreAnswer {
  type: "score"
  score: number
  confidence: number
  probabilities: Record<string, number>
}
export interface ChoiceAnswer<T extends string = string> {
  type: "choice"
  choice: T
  confidence: number
  probabilities: Record<T, number>
}
export interface NoulAnswer {
  type: "noul"
  noul: number
}

export type JevAnswers = Record<ScoreId, ScoreAnswer> & {
  task_type: ChoiceAnswer<TaskType>
  novel: NoulAnswer
  is_task: NoulAnswer
}

export interface JevResult {
  answers: JevAnswers
  model: string
  cost: number
  latencyMs: number
  truncated: boolean
  omittedChars: number
}

// Carries a code rather than text: the route handler localizes it.
export class JevError extends Error {
  constructor(
    public code: JevErrorCode,
    public status: number,
    // OpenRouter's own message, shown as is.
    public detail?: string
  ) {
    super(detail ? `${code}: ${detail}` : code)
  }
}

function buildState(prompt: string) {
  if (prompt.length <= MAX_STATE_CHARS) {
    return { state: { prompt }, truncated: false, omittedChars: 0 }
  }
  const omittedChars = prompt.length - HEAD_CHARS - TAIL_CHARS
  const text = `${prompt.slice(0, HEAD_CHARS)}\n\n[… ${omittedChars} characters omitted …]\n\n${prompt.slice(-TAIL_CHARS)}`
  return {
    state: {
      prompt: text,
      note: "The middle of this prompt was omitted for length. It continues the same material.",
    },
    truncated: true,
    omittedChars,
  }
}

const ERROR_CODES: Record<number, JevErrorCode> = {
  401: "badKey",
  402: "noCredits",
  413: "tooLarge",
  429: "rateLimited",
}

export async function askJev(prompt: string): Promise<JevResult> {
  const key = process.env.OPENROUTER_KEY
  if (!key) throw new JevError("noKey", 500)

  const { state, truncated, omittedChars } = buildState(prompt)
  const started = performance.now()

  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "X-Title": "Choose AI",
      },
      body: JSON.stringify({ model: JEV_MODEL, state, questions: QUESTIONS }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    })
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError"
    throw new JevError(timedOut ? "timeout" : "network", 504)
  }

  const latencyMs = Math.round(performance.now() - started)
  const body = await res.json().catch(() => null)

  if (!res.ok || !body?.answers) {
    const code = ERROR_CODES[res.status]
    const upstream: string | undefined = body?.error?.message
    throw new JevError(
      code ?? "upstream",
      res.ok ? 502 : res.status,
      code ? undefined : upstream
    )
  }

  return {
    answers: body.answers as JevAnswers,
    model: body.model,
    cost: body.usage?.cost ?? 0,
    latencyMs,
    truncated,
    omittedChars,
  }
}
