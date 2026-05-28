"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  IconChevronDown,
  IconFileText,
} from "@tabler/icons-react"

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  getKnowledgeArticleExplorerGroups,
} from "@/lib/knowledge-base/mock-data"
import type {
  KnowledgeArticleResolvedGroup,
  KnowledgeArticleStatus,
} from "@/lib/knowledge-base/types"
import { cn } from "@/lib/utils"

function getStatusDotClassName(status: KnowledgeArticleStatus) {
  if (status === "published") return "bg-emerald-500"
  if (status === "needs-review") return "bg-amber-400"
  return "bg-muted-foreground/45"
}

function normalizeSelectedArticleId(
  articleId: string | null,
  groups: KnowledgeArticleResolvedGroup[]
) {
  const articleIds = groups.flatMap((group) => group.articles.map((article) => article.id))
  if (articleId && articleIds.includes(articleId)) return articleId
  return articleIds[0] ?? null
}

const SIDEBAR_LABEL_SCROLL_DELAY_MS = 1000
const SIDEBAR_LABEL_SCROLL_GAP_PX = 24
const SIDEBAR_LABEL_SCROLL_SPEED_PX_PER_S = 20

function SidebarArticleLabel({
  children,
  disabled = false,
}: {
  children: string
  disabled?: boolean
}) {
  const containerRef = React.useRef<HTMLSpanElement | null>(null)
  const textRef = React.useRef<HTMLSpanElement | null>(null)
  const hoverTimeoutRef = React.useRef<number | null>(null)
  const [isTruncated, setIsTruncated] = React.useState(false)
  const [isScrolling, setIsScrolling] = React.useState(false)
  const [scrollDistance, setScrollDistance] = React.useState(0)
  const [animationDuration, setAnimationDuration] = React.useState(0)

  React.useEffect(() => {
    const updateOverflowState = () => {
      const container = containerRef.current
      const text = textRef.current
      if (!container || !text) return

      const nextDistance = Math.max(0, text.scrollWidth - container.clientWidth)
      setIsTruncated(nextDistance > 0)
      setScrollDistance(nextDistance)
      setAnimationDuration(nextDistance / SIDEBAR_LABEL_SCROLL_SPEED_PX_PER_S)

      if (nextDistance <= 0) {
        setIsScrolling(false)
      }
    }

    updateOverflowState()

    if (typeof ResizeObserver === "undefined") return

    const resizeObserver = new ResizeObserver(updateOverflowState)
    if (containerRef.current) resizeObserver.observe(containerRef.current)
    if (textRef.current) resizeObserver.observe(textRef.current)

    return () => resizeObserver.disconnect()
  }, [children])

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  React.useEffect(() => {
    if (!disabled) return

    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    setIsScrolling(false)
  }, [disabled])

  const handlePointerEnter = () => {
    if (disabled) return
    if (!isTruncated || typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current)
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(true)
      hoverTimeoutRef.current = null
    }, SIDEBAR_LABEL_SCROLL_DELAY_MS)
  }

  const handlePointerLeave = () => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    setIsScrolling(false)
  }

  return (
    <span
      ref={containerRef}
      className="relative min-w-0 flex-1 overflow-hidden"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <span
        ref={textRef}
        className={cn(
          "block whitespace-nowrap",
          isScrolling ? "overflow-visible" : "truncate"
        )}
        style={
          isScrolling && scrollDistance > 0
            ? {
                transform: `translateX(calc(-${scrollDistance}px - ${SIDEBAR_LABEL_SCROLL_GAP_PX}px))`,
                transition: `transform ${animationDuration}s linear`,
                willChange: "transform",
              }
            : undefined
        }
      >
        {children}
      </span>
    </span>
  )
}

export function KnowledgeSidebarPanel() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(() => {
    const groups = getKnowledgeArticleExplorerGroups()
    return Object.fromEntries(groups.map((group) => [group.id, group.defaultOpen]))
  })

  const groups = React.useMemo(() => {
    return getKnowledgeArticleExplorerGroups()
  }, [])

  const selectedArticleId = normalizeSelectedArticleId(
    searchParams.get("article"),
    groups
  )

  const replaceArticleQuery = (articleId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams.toString())
    nextSearchParams.set("article", articleId)
    const nextQuery = nextSearchParams.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)
  }

  return (
    <>
      <SidebarContent>
        <div className="flex flex-col gap-5 px-3 py-3">
          {groups.map((group) => {
            const isOpen = openGroups[group.id] ?? false

            return (
              <SidebarGroup key={group.id} className="gap-2 p-2 pb-3">
                <SidebarGroupLabel
                  render={
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((currentGroups) => ({
                          ...currentGroups,
                          [group.id]: !isOpen,
                        }))
                      }
                    />
                  }
                  className="h-8 cursor-pointer gap-2 bg-transparent px-2 py-2 font-mono tracking-widest text-sidebar-foreground/65 uppercase hover:bg-transparent hover:text-sidebar-foreground focus-visible:bg-transparent active:bg-transparent"
                >
                  <IconChevronDown
                    className={cn(
                      "size-4 transition-transform duration-200",
                      isOpen ? "rotate-0" : "-rotate-90"
                    )}
                  />
                  <span>{group.label}</span>
                </SidebarGroupLabel>

                {isOpen ? (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.articles.map((article) => {
                        const isActive = selectedArticleId === article.id

                        return (
                          <SidebarMenuItem key={article.id}>
                            <SidebarMenuButton
                              type="button"
                              isActive={isActive}
                              className="h-8 rounded-lg px-2 [&_svg]:text-muted-foreground"
                              onClick={() => replaceArticleQuery(article.id)}
                            >
                              <IconFileText className="size-4" />
                              <SidebarArticleLabel disabled={isActive}>
                                {article.title}
                              </SidebarArticleLabel>
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "ml-auto size-2 shrink-0 rounded-full",
                                  getStatusDotClassName(article.status)
                                )}
                              />
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                ) : null}
              </SidebarGroup>
            )
          })}
        </div>
      </SidebarContent>
    </>
  )
}
