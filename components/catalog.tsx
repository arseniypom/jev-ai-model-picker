"use client"

import { ChevronDown } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useLang } from "@/components/lang"
import { ProviderLogo } from "@/components/logos"
import { FAMILIES, MODELS } from "@/lib/models"
import type { PickResult } from "@/lib/select"
import { formatCost, statusText } from "@/lib/format"
import { cn } from "@/lib/utils"

export function Catalog({ models }: { models: PickResult["models"] }) {
  const status = new Map(models.map((m) => [m.id, m.status]))
  const { t } = useLang()

  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center justify-between py-1 text-sm font-medium outline-none focus-visible:underline">
        {t.allModels(MODELS.length)}
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
        <div className="grid gap-x-10 gap-y-6 pt-5 sm:grid-cols-2">
          {FAMILIES.map((family) => (
            <section key={family.name}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <ProviderLogo provider={family.provider} className="size-4" />
                {family.name}
              </h3>
              <table className="w-full text-sm">
                <thead className="sr-only">
                  <tr>
                    <th>{t.columns.mode}</th>
                    <th>{t.columns.index}</th>
                    <th>{t.columns.cost}</th>
                    <th>{t.columns.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {family.models.map((m) => {
                    const s = status.get(m.id)!
                    return (
                      <tr
                        key={m.id}
                        className={cn(
                          "border-t border-border/70",
                          s === "chosen" ? "font-medium" : "text-muted-foreground",
                          s === "dominated" && "text-muted-foreground/70"
                        )}
                      >
                        <td className={cn("py-1.5 pr-2", s === "chosen" && "text-foreground")}>
                          {m.effort}
                        </td>
                        <td className="py-1.5 pr-2 text-right tabular-nums">{m.index}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{formatCost(m.cost)}</td>
                        <td className={cn("py-1.5 text-right text-xs", s === "chosen" && "text-foreground")}>
                          {statusText(m, s, t)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
