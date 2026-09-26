# Jev AI Model Picker

Paste a prompt, get the cheapest model that will handle it well.

**Live demo:** https://choose-ai-eosin.vercel.app

## How it works

1. [Jev](https://openrouter.ai/docs/guides/community/jev) (`typesafe/jev-1.13` on OpenRouter) doesn't generate text. It answers typed questions with probabilities. The app asks it to rate the prompt: overall difficulty, reasoning depth, expertise, cost of a mistake, output size, task type.
2. `lib/select.ts` turns that probability distribution into the minimum [Artificial Analysis](https://artificialanalysis.ai) Intelligence Index the task needs.
3. The app picks the cheapest model (by average cost per task, not per token) that clears that bar with ≥ 80% probability, and suggests the best option from the other provider.

A single Jev call costs a fraction of a cent and takes under a second.

## Run locally

You'll need Node.js 20+ and an [OpenRouter API key](https://openrouter.ai/keys).

```bash
git clone https://github.com/arseniypom/jev-ai-model-picker.git
cd jev-ai-model-picker
cp .env.example .env   # then set OPENROUTER_KEY
npm install
npm run dev
```

Open http://localhost:3000.

## Tweaking

- **Models, indices, prices:** `lib/models.ts`
- **Selection logic** (index per difficulty level, factor weights, 80% threshold): `lib/select.ts`
- **Questions sent to Jev:** `lib/jev.ts`
- **UI text (English / Russian):** `lib/i18n.ts`

Built with Next.js, Tailwind CSS and shadcn/ui.

## License

[MIT](LICENSE)
