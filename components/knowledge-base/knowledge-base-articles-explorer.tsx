"use client"

import { useState } from "react"
import {
  IconChevronDown,
  IconFileText,
} from "@tabler/icons-react"

import { knowledgeBasePageCopy } from "@/components/knowledge-base/knowledge-base-page.copy"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type {
  KnowledgeArticleResolvedGroup,
  KnowledgeArticleStatus,
} from "@/lib/knowledge-base/types"
import { cn } from "@/lib/utils"

type KnowledgeBaseArticlesExplorerProps = {
  groups: KnowledgeArticleResolvedGroup[]
  selectedArticleId: string | null
  onSelectArticle: (articleId: string) => void
}

function getStatusDotClassName(status: KnowledgeArticleStatus) {
  if (status === "published") return "bg-emerald-500"
  if (status === "needs-review") return "bg-amber-400"
  return "bg-muted-foreground/45"
}

export function KnowledgeBaseArticlesExplorer({
  groups,
  selectedArticleId,
  onSelectArticle,
}: KnowledgeBaseArticlesExplorerProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((group) => [group.id, group.defaultOpen]))
  )

  return (
    <section className="min-h-0 flex-1 py-6">
      <div className="w-full max-w-xl">
        <div className="space-y-1">
          {groups.map((group) => {
            const isOpen = openGroups[group.id] ?? false

            return (
              <Collapsible
                key={group.id}
                open={isOpen}
                onOpenChange={(nextOpen) =>
                  setOpenGroups((currentGroups) => ({
                    ...currentGroups,
                    [group.id]: nextOpen,
                  }))
                }
                className="rounded-2xl"
              >
                <CollapsibleTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11 w-full justify-start rounded-2xl px-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    />
                  }
                >
                  <IconChevronDown
                    className={cn(
                      "size-4 transition-transform duration-200",
                      isOpen ? "rotate-0" : "-rotate-90"
                    )}
                  />
                  <span className="truncate text-sm font-semibold tracking-[0.14em] uppercase">
                    {group.label}
                  </span>
                </CollapsibleTrigger>

                <CollapsibleContent className="pt-1">
                  {group.articles.length > 0 ? (
                    <div className="space-y-1 border-l border-border/70 pl-2">
                      {group.articles.map((article) => {
                        const isActive = selectedArticleId === article.id

                        return (
                          <Button
                            key={article.id}
                            type="button"
                            variant="ghost"
                            aria-pressed={isActive}
                            className={cn(
                              "relative h-12 w-full justify-start rounded-xl px-3 text-left hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
                              "aria-pressed:bg-muted/70 aria-pressed:text-foreground"
                            )}
                            onClick={() => onSelectArticle(article.id)}
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                "absolute inset-y-2 left-0 w-0.5 rounded-full bg-transparent transition-colors",
                                isActive ? "bg-primary" : "bg-transparent"
                              )}
                            />
                            <IconFileText
                              className={cn(
                                "size-4 shrink-0 text-muted-foreground",
                                isActive ? "text-primary" : "text-muted-foreground"
                              )}
                            />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                              {article.title}
                            </span>
                            <span
                              aria-hidden="true"
                              className={cn(
                                "size-2.5 shrink-0 rounded-full",
                                getStatusDotClassName(article.status)
                              )}
                            />
                            <span className="sr-only">
                              {knowledgeBasePageCopy.explorerStatusLabel}:{" "}
                              {article.status}
                            </span>
                          </Button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">
                        {knowledgeBasePageCopy.articlesEmptyTitle}
                      </p>
                      <p className="mt-1 leading-6">
                        {knowledgeBasePageCopy.articlesEmptyDescription}
                      </p>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </div>
    </section>
  )
}
