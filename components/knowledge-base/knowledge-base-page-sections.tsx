import { IconArrowLeft, IconPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type KnowledgeBasePageHeaderProps = {
  title: string
  description: string
  sourceTicketLabel?: string | null
  backToTicketLabel?: string
  createArticleLabel: string
  onBackToTicket?: () => void
}

export function KnowledgeBasePageHeader({
  title,
  description,
  sourceTicketLabel,
  backToTicketLabel = "Back to ticket",
  createArticleLabel,
  onBackToTicket,
}: KnowledgeBasePageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {sourceTicketLabel ? (
            <span className="inline-flex items-center rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium text-foreground">
              {sourceTicketLabel}
            </span>
          ) : null}
        </div>
        <div className="space-y-1">
          <h1 className="text-xl leading-tight font-semibold tracking-tight text-foreground max-sm:text-lg sm:text-3xl">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-start">
        {onBackToTicket ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl"
            onClick={onBackToTicket}
          >
            <IconArrowLeft className="size-4" />
            {backToTicketLabel}
          </Button>
        ) : null}
        <Button type="button" size="sm" className="h-9 rounded-xl">
          <IconPlus className="size-4" />
          {createArticleLabel}
        </Button>
      </div>
    </section>
  )
}

type KnowledgeBaseContentPlaceholderProps = {
  eyebrow: string
  title: string
  description: string
  className?: string
}

export function KnowledgeBaseContentPlaceholder({
  eyebrow,
  title,
  description,
  className,
}: KnowledgeBaseContentPlaceholderProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-dashed bg-card/70 p-6 text-card-foreground sm:p-8",
        className
      )}
    >
      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </section>
  )
}
