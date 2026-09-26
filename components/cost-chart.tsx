"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { useLang } from "@/components/lang"
import { DOMINATED_BY, MODELS, getModel, type Model } from "@/lib/models"
import type { ModelStatus, PickResult } from "@/lib/select"
import { formatCost, modelName, statusText } from "@/lib/format"
import { cn } from "@/lib/utils"

const HEIGHT = 240
const M = { top: 14, right: 14, bottom: 30, left: 44 }
const X_DOMAIN = [22, 61] as const
const X_TICKS = [25, 30, 35, 40, 45, 50, 55, 60]
const Y_DOMAIN = [0.014, 11] as const
const Y_TICKS = [0.02, 0.1, 0.5, 2, 8]

const SERIES = {
  openai: "var(--openai)",
  anthropic: "var(--anthropic)",
} as const

// The Pareto frontier: models nobody beats on both intelligence and price.
const FRONTIER = MODELS.filter((m) => !DOMINATED_BY.has(m.id)).sort(
  (a, b) => a.index - b.index
)

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width))
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

export function CostChart({
  models,
  requiredIndex,
  alternativeId,
}: {
  models: PickResult["models"]
  requiredIndex: number
  alternativeId?: string
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hovered, setHovered] = useState<string | null>(null)
  const { t } = useLang()

  const plotW = Math.max(0, width - M.left - M.right)
  const plotH = HEIGHT - M.top - M.bottom
  const x = (index: number) =>
    M.left + ((index - X_DOMAIN[0]) / (X_DOMAIN[1] - X_DOMAIN[0])) * plotW
  const logMin = Math.log(Y_DOMAIN[0])
  const logSpan = Math.log(Y_DOMAIN[1]) - logMin
  const y = (cost: number) =>
    M.top + plotH - ((Math.log(cost) - logMin) / logSpan) * plotH

  const points = models.map(({ id, status }) => ({ model: getModel(id), status }))
  const chosen = points.find((p) => p.status === "chosen")!
  const alternative = points.find((p) => p.model.id === alternativeId)
  const rank = (p: (typeof points)[number]) =>
    p.status === "chosen" ? 2 : p === alternative ? 1 : 0
  // Draw the picks last so nothing covers them.
  const ordered = [...points].sort((a, b) => rank(a) - rank(b))
  // With two picks, the one further right labels rightward and the other leftward.
  const altOnRight = alternative && alternative.model.index > chosen.model.index

  const reqX = x(Math.min(Math.max(requiredIndex, X_DOMAIN[0]), X_DOMAIN[1]))
  const hoveredPoint = points.find((p) => p.model.id === hovered)

  return (
    <figure className="m-0">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="text-sm font-medium">{t.chartTitle}</span>
        <span className="flex items-center gap-4 text-xs text-muted-foreground">
          <LegendDot color={SERIES.openai} label="OpenAI" />
          <LegendDot color={SERIES.anthropic} label="Anthropic" />
          <LegendDot hollow label={t.betterValueExists} />
        </span>
      </figcaption>

      <div ref={ref} className="relative" onPointerLeave={() => setHovered(null)}>
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={t.chartAria(modelName(chosen.model))}
            className="block overflow-visible"
          >
            {/* Below the required level: models that may fall short. */}
            <rect
              x={M.left}
              y={M.top}
              width={Math.max(0, reqX - M.left)}
              height={plotH}
              className="fill-muted"
              opacity={0.7}
            />

            {Y_TICKS.map((t) => (
              <g key={t}>
                <line
                  x1={M.left}
                  x2={M.left + plotW}
                  y1={y(t)}
                  y2={y(t)}
                  className="stroke-border"
                  strokeWidth={1}
                />
                <text
                  x={M.left - 8}
                  y={y(t)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-muted-foreground text-[11px] tabular-nums"
                >
                  {t >= 1 ? `$${t}` : `$${t.toFixed(2)}`}
                </text>
              </g>
            ))}

            {X_TICKS.map((t) => (
              <text
                key={t}
                x={x(t)}
                y={M.top + plotH + 18}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px] tabular-nums"
              >
                {t}
              </text>
            ))}

            <line
              x1={reqX}
              x2={reqX}
              y1={M.top}
              y2={M.top + plotH}
              className="stroke-foreground"
              strokeWidth={1}
            />
            {/* Bottom right is always empty: nothing is both smart and cheap. */}
            <text
              x={reqX + (reqX > M.left + plotW - 90 ? -6 : 6)}
              y={M.top + plotH - 8}
              textAnchor={reqX > M.left + plotW - 90 ? "end" : "start"}
              className="fill-foreground text-[11px] font-medium"
            >
              {t.needsFrom(requiredIndex)}
            </text>

            <polyline
              points={FRONTIER.map((m) => `${x(m.index)},${y(m.cost)}`).join(" ")}
              fill="none"
              className="stroke-muted-foreground"
              strokeOpacity={0.35}
              strokeWidth={1}
              strokeLinejoin="round"
            />

            {ordered.map(({ model, status }) => (
              <Point
                key={model.id}
                cx={x(model.index)}
                cy={y(model.cost)}
                model={model}
                status={status}
                alternative={model.id === alternativeId}
                dimmed={hovered !== null && hovered !== model.id}
                onHover={() => setHovered(model.id)}
              />
            ))}

            <PickLabel
              cx={x(chosen.model.index)}
              cy={y(chosen.model.cost)}
              text={modelName(chosen.model)}
              left={M.left}
              right={M.left + plotW}
              side={alternative && altOnRight ? "left" : "right"}
            />
            {alternative && (
              <PickLabel
                cx={x(alternative.model.index)}
                cy={y(alternative.model.cost)}
                text={modelName(alternative.model)}
                left={M.left}
                right={M.left + plotW}
                side={altOnRight ? "right" : "left"}
                muted
              />
            )}
          </svg>
        )}

        {hoveredPoint && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-56 rounded-md bg-foreground px-3 py-2 text-xs text-background shadow-sm"
            style={{
              left: Math.min(
                Math.max(x(hoveredPoint.model.index), 90),
                width - 90
              ),
              top: y(hoveredPoint.model.cost) - 12,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-medium">{modelName(hoveredPoint.model)}</div>
            <div className="opacity-80">
              {t.indexAndCost(hoveredPoint.model.index, formatCost(hoveredPoint.model.cost))}
            </div>
            <div className="opacity-80">
              {statusText(hoveredPoint.model, hoveredPoint.status, t)}
            </div>
          </div>
        )}
      </div>
      <div className="mt-1 text-right text-xs text-muted-foreground">
        Intelligence Index, Artificial Analysis
      </div>
    </figure>
  )
}

function Point({
  cx,
  cy,
  model,
  status,
  alternative,
  dimmed,
  onHover,
}: {
  cx: number
  cy: number
  model: Model
  status: ModelStatus
  alternative: boolean
  dimmed: boolean
  onHover: () => void
}) {
  const color = SERIES[model.provider]
  const chosen = status === "chosen"
  const opacity =
    status === "insufficient" ? 0.35 : status === "dominated" ? 0.6 : 1

  return (
    <g
      onPointerEnter={onHover}
      className="transition-opacity"
      opacity={dimmed ? 0.3 : 1}
    >
      {(chosen || alternative) && (
        <circle
          cx={cx}
          cy={cy}
          r={chosen ? 10 : 8}
          fill="none"
          className={chosen ? "stroke-foreground" : "stroke-muted-foreground"}
          strokeWidth={chosen ? 1.5 : 1}
        />
      )}
      {status === "dominated" ? (
        <circle
          cx={cx}
          cy={cy}
          r={3.5}
          className="fill-card"
          stroke={color}
          strokeWidth={1.5}
          opacity={opacity}
        />
      ) : (
        <circle
          cx={cx}
          cy={cy}
          r={chosen ? 6 : 4}
          fill={color}
          className="stroke-card"
          strokeWidth={2}
          opacity={opacity}
        />
      )}
      {/* Generous hit target. */}
      <circle cx={cx} cy={cy} r={12} fill="transparent" />
    </g>
  )
}

function PickLabel({
  cx,
  cy,
  text,
  left,
  right,
  side,
  muted,
}: {
  cx: number
  cy: number
  text: string
  left: number
  right: number
  side: "left" | "right"
  muted?: boolean
}) {
  const width = text.length * 7
  const onLeft =
    side === "left" ? cx - 16 - width >= left : cx + 16 + width > right
  return (
    <text
      x={cx + (onLeft ? -16 : 16)}
      y={cy}
      dy="0.32em"
      textAnchor={onLeft ? "end" : "start"}
      className={cn(
        "pointer-events-none stroke-card text-xs",
        muted ? "fill-muted-foreground" : "fill-foreground font-medium"
      )}
      strokeWidth={4}
      paintOrder="stroke"
    >
      {text}
    </text>
  )
}

function LegendDot({
  color,
  label,
  hollow,
}: {
  color?: string
  label: string
  hollow?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "inline-block size-2 rounded-full",
          hollow && "border-[1.5px] border-muted-foreground"
        )}
        style={hollow ? undefined : { background: color }}
      />
      {label}
    </span>
  )
}
