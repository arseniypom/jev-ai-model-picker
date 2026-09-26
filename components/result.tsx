import { Catalog } from "@/components/catalog"
import { CostChart } from "@/components/cost-chart"
import { useLang } from "@/components/lang"
import { ProviderLogo } from "@/components/logos"
import { Skeleton } from "@/components/ui/skeleton"
import { PROVIDER_NAME, getModel, type Model } from "@/lib/models"
import type { PickResult } from "@/lib/select"
import { formatCost, modelName, percent } from "@/lib/format"
import { cn } from "@/lib/utils"

const SUFFICIENT = 0.8
const NOT_A_TASK = 0.3

export function Result({ result }: { result: PickResult }) {
  const { analysis, meta } = result
  const { t } = useLang()
  const level = t.levels[Math.round(analysis.level)] ?? t.levels[0]
  const taskType = t.taskTypes[analysis.taskType] ?? t.taskTypes.other
  const pick = { ...result.pick, model: getModel(result.pick.id) }
  const alt = result.alternative && {
    ...result.alternative,
    model: getModel(result.alternative.id),
  }

  return (
    <section
      aria-live="polite"
      className="animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none"
    >
      <p className="text-lg leading-snug text-balance">
        {t.summary(level, taskType)}{" "}
        <span className="text-muted-foreground">{t.requiredIndex(analysis.requiredIndex)}</span>
      </p>

      {(analysis.isTask < NOT_A_TASK || meta.truncated) && (
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          {analysis.isTask < NOT_A_TASK && (
            <p>{t.notATask}</p>
          )}
          {meta.truncated && (
            <p>{t.truncated(meta.omittedChars.toLocaleString(t.locale))}</p>
          )}
        </div>
      )}

      <div className={cn("mt-6 grid gap-3", alt && "sm:grid-cols-2")}>
        <ModelTile model={pick.model} sufficiency={pick.sufficiency} chosen />
        {alt && (
          <ModelTile
            model={alt.model}
            sufficiency={alt.sufficiency}
            note={
              alt.sufficiency < SUFFICIENT
                ? t.mayFallShort
                : t.pricier(alt.model.cost / pick.model.cost)
            }
          />
        )}
      </div>

      <Divider />

      <h3 className="text-sm font-medium">{t.howJevRated}</h3>
      <dl className="mt-4 grid gap-x-10 gap-y-3 sm:grid-cols-2">
        {analysis.factors.map((f) => (
          <div key={f.id} className="grid grid-cols-[7.5rem_1fr] items-center gap-3">
            <dt className="text-sm text-muted-foreground">{t.factors[f.id]}</dt>
            <dd>
              <Meter value={f.value} className="h-1" />
            </dd>
          </div>
        ))}
      </dl>

      <Divider />
      <CostChart
        models={result.models}
        requiredIndex={analysis.requiredIndex}
        alternativeId={alt?.id}
      />

      <Divider />
      <Catalog models={result.models} />

      <p className="mt-10 text-xs text-muted-foreground">
        {t.footer(meta.latencyMs, formatCost(meta.cost))}
      </p>
    </section>
  )
}

function ModelTile({
  model,
  sufficiency,
  chosen,
  note,
}: {
  model: Model
  sufficiency: number
  chosen?: boolean
  note?: string
}) {
  const { t } = useLang()
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border p-5",
        chosen ? "border-foreground/80 bg-card" : "border-border"
      )}
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <ProviderLogo provider={model.provider} className="size-4" />
          {PROVIDER_NAME[model.provider]}
        </span>
        {chosen ? (
          <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
            {t.bestPick}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{note}</span>
        )}
      </div>

      <div
        className={cn(
          "mt-4 leading-tight font-semibold tracking-tight",
          chosen ? "text-2xl" : "text-xl text-foreground/85"
        )}
      >
        {modelName(model)}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        {t.indexAndCost(model.index, formatCost(model.cost))}
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-baseline justify-between text-xs text-muted-foreground">
          <span>{t.enoughChance}</span>
          <span className="font-medium text-foreground tabular-nums">{percent(sufficiency)}</span>
        </div>
        <Meter
          value={sufficiency}
          className="mt-1.5 h-1"
          fill={chosen ? undefined : "bg-muted-foreground"}
        />
      </div>
    </div>
  )
}

export function ResultSkeleton() {
  return (
    <div aria-hidden className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 rounded-xl" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>
      <Skeleton className="h-1.5 w-full" />
      <div className="grid gap-3 pt-6 sm:grid-cols-2">
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
      </div>
    </div>
  )
}

function Meter({
  value,
  className,
  fill = "bg-foreground",
}: {
  value: number
  className?: string
  fill?: string
}) {
  return (
    <div className={cn("overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", fill)}
        style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }}
      />
    </div>
  )
}

const Divider = () => <hr className="my-8 border-border" />
