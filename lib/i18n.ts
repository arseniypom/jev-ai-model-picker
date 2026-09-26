import type { TaskType } from "@/lib/jev"
import type { Factor } from "@/lib/select"

export const LANGS = ["en", "ru"] as const
export type Lang = (typeof LANGS)[number]
export const DEFAULT_LANG: Lang = "en"
export const LANG_COOKIE = "lang"

export const isLang = (x: unknown): x is Lang => LANGS.includes(x as Lang)

export type JevErrorCode =
  | "noKey"
  | "timeout"
  | "network"
  | "badKey"
  | "noCredits"
  | "tooLarge"
  | "rateLimited"
  | "upstream"

const en = {
  locale: "en-US",
  title: "Find the right AI model",
  subtitle:
    "Jev picks the best model for your task: smart enough to handle it, and cheap enough not to waste tokens.",
  provider: "Provider",
  anyProvider: "Any",
  promptLabel: "Prompt",
  placeholder: "Paste your prompt",
  chars: (n: string) => `${n} chars`,
  submit: "Pick a model",
  tooManyRequests: "Too many requests. Wait a minute and try again.",
  httpError: (status: number) => `Error ${status}`,
  pickFailed: "Couldn't pick a model.",

  // Read as "{level} task, {type}."
  levels: ["Trivial", "Simple", "Moderate", "Hard", "Expert-level", "Frontier-level"],
  taskTypes: {
    coding: "coding",
    math: "math",
    analysis: "analysis",
    writing: "writing",
    transform: "text transformation",
    knowledge: "knowledge question",
    planning: "planning",
    chat: "chat",
    other: "other",
  } satisfies Record<TaskType, string>,
  summary: (level: string, type: string) => `${level} task, ${type}.`,
  requiredIndex: (n: number) => `Needs a model with an index of ${n} or higher.`,
  notATask: "This doesn't look like a task for a model, so the estimate is rough.",
  truncated: (n: string) =>
    `Long prompt: Jev read the beginning and the end, skipping ${n} characters in the middle.`,
  mayFallShort: "May fall short",
  pricier: (x: number) => `${Math.round(x * 10) / 10}× pricier`,
  howJevRated: "How Jev rated the task",
  factors: {
    reasoning: "Reasoning",
    expertise: "Expertise",
    precision: "Cost of error",
    scope: "Output size",
  } satisfies Record<Factor, string>,
  footer: (ms: number, cost: string) =>
    `Jev's estimate took ${ms} ms and cost ${cost}. Indices and task prices: Artificial Analysis.`,
  bestPick: "Best pick",
  indexAndCost: (index: number, cost: string) => `Index ${index}, ${cost} per task`,
  enoughChance: "Capable enough",

  allModels: (n: number) => `All models (${n})`,
  columns: { mode: "Mode", index: "Index", cost: "Task cost", status: "Status" },
  status: {
    chosen: "Picked",
    overkill: "Capable, but pricier",
    insufficient: "May fall short",
    dominatedBy: (name: string) => `${name} is better value`,
    dominated: "Poor value",
  },

  chartTitle: "Intelligence and price of every model",
  betterValueExists: "better value exists",
  chartAria: (name: string) =>
    `Models by Intelligence Index and task price. ${name} is picked.`,
  needsFrom: (n: number) => `needs ${n}+`,

  api: {
    emptyPrompt: "Paste a prompt.",
    promptTooLong: "The prompt is over a million characters — that's too much.",
    internal: "Something went wrong.",
    jev: {
      noKey: "OPENROUTER_KEY is not set.",
      timeout: "Jev didn't respond in time.",
      network: "Couldn't reach OpenRouter.",
      badKey: "OpenRouter rejected the API key.",
      noCredits: "Your OpenRouter balance is out of credits.",
      tooLarge: "The prompt is too large for Jev.",
      rateLimited: "Too many requests to Jev, try again in a minute.",
      upstream: "Jev returned an error.",
    } satisfies Record<JevErrorCode, string>,
  },
}

export type Dict = typeof en

const ru: Dict = {
  locale: "ru-RU",
  title: "Подбор оптимальной ИИ-модели",
  subtitle:
    "Jev подберёт самую оптимальную модель под Вашу задачу: достаточно умную, чтобы справиться, и достаточно дешёвую, чтобы не тратить лишние токены.",
  provider: "Провайдер",
  anyProvider: "Любой",
  promptLabel: "Промпт",
  placeholder: "Вставьте Ваш промпт",
  chars: (n) => `${n} симв.`,
  submit: "Подобрать модель",
  tooManyRequests: "Слишком много запросов. Подождите минуту и попробуйте снова.",
  httpError: (status) => `Ошибка ${status}`,
  pickFailed: "Не удалось подобрать модель.",

  // Read as "Задача {level}, {type}."
  levels: [
    "тривиальная",
    "простая",
    "средней сложности",
    "сложная",
    "экспертного уровня",
    "на пределе возможностей ИИ",
  ],
  taskTypes: {
    coding: "код",
    math: "математика",
    analysis: "анализ",
    writing: "написание текста",
    transform: "преобразование текста",
    knowledge: "вопрос на знания",
    planning: "планирование",
    chat: "общение",
    other: "другое",
  },
  summary: (level, type) => `Задача ${level}, ${type}.`,
  requiredIndex: (n) => `Нужна модель с индексом от ${n}.`,
  notATask: "Текст не похож на задачу для модели, поэтому оценка условная.",
  truncated: (n) =>
    `Промпт длинный: Jev прочитал начало и конец, пропустив ${n} символов в середине.`,
  mayFallShort: "Может не хватить уровня",
  pricier: (x) => {
    const rounded = Math.round(x * 10) / 10
    // "в 1,5 раза", "в 3 раза", "в 5 раз"
    const few = !Number.isInteger(rounded) || (rounded >= 2 && rounded < 5)
    return `В ${rounded.toLocaleString("ru-RU")} ${few ? "раза" : "раз"} дороже`
  },
  howJevRated: "Как Jev оценил задачу",
  factors: {
    reasoning: "Рассуждение",
    expertise: "Экспертиза",
    precision: "Цена ошибки",
    scope: "Объём ответа",
  },
  footer: (ms, cost) =>
    `Оценка Jev заняла ${ms} мс и стоила ${cost}. Индексы и цены задач: Artificial Analysis.`,
  bestPick: "Оптимальный выбор",
  indexAndCost: (index, cost) => `Индекс ${index}, ${cost} за задачу`,
  enoughChance: "Уровня хватит",

  allModels: (n) => `Все модели (${n})`,
  columns: { mode: "Режим", index: "Индекс", cost: "Цена задачи", status: "Статус" },
  status: {
    chosen: "Выбрана",
    overkill: "Справится, но дороже",
    insufficient: "Может не хватить",
    dominatedBy: (name) => `Выгоднее ${name}`,
    dominated: "Невыгодна",
  },

  chartTitle: "Интеллект и цена всех моделей",
  betterValueExists: "есть выгоднее",
  chartAria: (name) => `Модели по индексу интеллекта и цене задачи. Выбрана ${name}.`,
  needsFrom: (n) => `нужно от ${n}`,

  api: {
    emptyPrompt: "Вставьте промпт.",
    promptTooLong: "Промпт длиннее миллиона символов — это слишком.",
    internal: "Что-то пошло не так.",
    jev: {
      noKey: "Не задан OPENROUTER_KEY.",
      timeout: "Jev не ответил вовремя.",
      network: "Не удалось связаться с OpenRouter.",
      badKey: "OpenRouter не принял ключ API.",
      noCredits: "На балансе OpenRouter закончились кредиты.",
      tooLarge: "Промпт слишком большой для Jev.",
      rateLimited: "Слишком много запросов к Jev, попробуйте через минуту.",
      upstream: "Jev вернул ошибку.",
    },
  },
}

export const DICT: Record<Lang, Dict> = { en, ru }
