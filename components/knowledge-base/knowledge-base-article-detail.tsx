"use client"

import * as React from "react"
import {
  IconActivity,
  IconBold,
  IconChartBar,
  IconDots,
  IconEye,
  IconFileText,
  IconH2,
  IconH3,
  IconItalic,
  IconLink,
  IconList,
  IconListNumbers,
  IconMessage,
  IconPencil,
  IconUnderline,
  IconWand,
} from "@tabler/icons-react"
import {
  EditorContent,
  useEditor,
  type Editor,
  type JSONContent,
} from "@tiptap/react"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import StarterKit from "@tiptap/starter-kit"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { knowledgeBasePageCopy } from "@/components/knowledge-base/knowledge-base-page.copy"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useKnowledgeArticleEditor } from "@/components/knowledge-base/use-knowledge-article-editor"
import {
  isSuggestedReplyHeading,
} from "@/lib/knowledge-base/content"
import type {
  KnowledgeArticle,
  KnowledgeArticleSavePatch,
  KnowledgeArticleStatus,
} from "@/lib/knowledge-base/types"
import { cn } from "@/lib/utils"

type KnowledgeBaseArticleDetailProps = {
  article: KnowledgeArticle
  activeTab: ArticleDetailTab
  startInEditMode?: boolean
  onEditModeStarted?: () => void
  onTabChange: (tab: ArticleDetailTab) => void
  onSaveArticle: (articleId: string, patch: KnowledgeArticleSavePatch) => void
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void
}

export type ArticleDetailTab = "content" | "insights" | "comments" | "activity"

export const articleDetailTabs: Array<{
  value: ArticleDetailTab
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { value: "content", label: knowledgeBasePageCopy.contentTab, icon: IconFileText },
  { value: "insights", label: knowledgeBasePageCopy.insightsTab, icon: IconChartBar },
  { value: "comments", label: knowledgeBasePageCopy.commentsTab, icon: IconMessage },
  { value: "activity", label: knowledgeBasePageCopy.activityTab, icon: IconActivity },
]

const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [2, 3],
    },
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: "https",
  }),
]

const articleStatusOptions: Array<{
  value: KnowledgeArticleStatus
  label: string
}> = [
  { value: "published", label: knowledgeBasePageCopy.statusPublished },
  { value: "draft", label: knowledgeBasePageCopy.statusDraft },
  { value: "needs-review", label: knowledgeBasePageCopy.statusNeedsReview },
]

function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function getArticleStatusLabel(status: KnowledgeArticleStatus) {
  if (status === "published") return knowledgeBasePageCopy.statusPublished
  if (status === "needs-review") return knowledgeBasePageCopy.statusNeedsReview
  return knowledgeBasePageCopy.statusDraft
}

function getArticleStatusClassName(status: KnowledgeArticleStatus) {
  if (status === "published") {
    return "border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
  }
  if (status === "needs-review") {
    return "border-amber-500/20 bg-amber-500/12 text-amber-700 dark:text-amber-300"
  }
  return "border-border bg-muted text-muted-foreground"
}

function getCategoryLabel(category: string) {
  return category.replaceAll("-", " ")
}

function getAuthorInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function ArticleAuthorAvatar({
  name,
  avatarUrl,
}: {
  name: string
  avatarUrl?: string
}) {
  return (
    <Avatar className="size-6 border border-border/70 bg-background" size="sm">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback className="text-[10px] font-medium">
        {getAuthorInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

function renderInlineNode(node: JSONContent, key: React.Key): React.ReactNode {
  const keyString = String(key)
  let content: React.ReactNode = node.text ?? node.content?.map((child, index) =>
    renderInlineNode(child, `${keyString}-${index}`)
  )

  node.marks?.forEach((mark) => {
    if (mark.type === "bold") {
      content = <strong>{content}</strong>
    }
    if (mark.type === "italic") {
      content = <em>{content}</em>
    }
    if (mark.type === "underline") {
      content = <span className="underline underline-offset-4">{content}</span>
    }
    if (mark.type === "link") {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#"
      content = (
        <a
          href={href}
          className="font-medium text-primary underline underline-offset-4"
        >
          {content}
        </a>
      )
    }
  })

  return <React.Fragment key={key}>{content}</React.Fragment>
}

function renderInlineContent(node: JSONContent, keyPrefix: string) {
  return node.content?.map((child, index) =>
    renderInlineNode(child, `${keyPrefix}-${index}`)
  )
}

function ArticleMedia({ article }: { article: KnowledgeArticle }) {
  const media = article.media?.[0]
  if (!media) return null

  if (media.type === "image" && media.src) {
    return (
      <div className="flex flex-col gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.src} alt={media.title} className="w-full object-cover" />
        {media.caption ? (
          <p className="text-sm leading-6 text-muted-foreground">{media.caption}</p>
        ) : null}
      </div>
    )
  }

  if (media.type === "video") {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        {media.title} · {media.duration}
      </p>
    )
  }

  return null
}

function KnowledgeArticleContentView({
  article,
  document,
  title,
  showMedia = true,
  showBodyHeading = true,
}: {
  article: KnowledgeArticle
  document: JSONContent
  title: string
  showMedia?: boolean
  showBodyHeading?: boolean
}) {
  const blocks = document.content ?? []
  const mediaInsertIndex = Math.min(3, Math.max(blocks.length - 1, 0))

  return (
    <div className="flex flex-col gap-6 text-base leading-8 text-foreground/80">
      {showBodyHeading ? (
        <h1 className="text-3xl leading-tight font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      ) : null}

      {blocks.map((block, index) => {
        const key = `${article.id}-${block.type ?? "block"}-${index}`
        const isReply = isSuggestedReplyHeading(block)

        if (block.type === "heading") {
          const level = block.attrs?.level === 3 ? 3 : 2
          const HeadingTag = level === 3 ? "h3" : "h2"

          return (
            <HeadingTag
              key={key}
              className={cn(
                "leading-tight font-semibold tracking-tight text-foreground",
                level === 3 ? "text-xl" : "text-2xl"
              )}
            >
              {isReply
                ? knowledgeBasePageCopy.bodyCustomerReplyTitle
                : renderInlineContent(block, key)}
            </HeadingTag>
          )
        }

        if (block.type === "blockquote") {
          return (
            <div
              key={key}
              className="flex items-start gap-3 rounded-2xl border bg-muted/30 px-5 py-4 text-base text-foreground/85"
            >
              <IconWand className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="min-w-0">
                <span className="font-medium text-foreground">
                  {knowledgeBasePageCopy.bodyQuickPathTitle}:
                </span>{" "}
                {block.content?.map((child, childIndex) =>
                  renderInlineContent(child, `${key}-${childIndex}`)
                )}
              </div>
            </div>
          )
        }

        if (block.type === "bulletList" || block.type === "orderedList") {
          const ListTag = block.type === "orderedList" ? "ol" : "ul"

          return (
            <ListTag
              key={key}
              className={cn(
                "flex list-inside flex-col gap-2 text-base leading-7 text-foreground/78",
                block.type === "orderedList" ? "list-decimal" : "list-disc"
              )}
            >
              {block.content?.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>
                  {item.content?.map((child, childIndex) =>
                    renderInlineContent(child, `${key}-${itemIndex}-${childIndex}`)
                  )}
                </li>
              ))}
            </ListTag>
          )
        }

        const blockContent = renderInlineContent(block, key)

        return (
          <React.Fragment key={key}>
            <p
              className={cn(
                "text-base leading-8 text-foreground/78",
                isReply &&
                  "rounded-2xl border bg-muted/40 px-5 py-4 text-base leading-8 text-foreground/85"
              )}
            >
              {blockContent}
            </p>
            {showMedia && article.media?.length && index === mediaInsertIndex ? (
              <ArticleMedia article={article} />
            ) : null}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function ToolbarButton({
  active,
  children,
  label,
  onClick,
}: {
  active?: boolean
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "size-9 rounded-xl text-muted-foreground hover:text-foreground",
        active && "bg-muted text-foreground"
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function ArticleLinkDialog({
  open,
  initialUrl,
  onOpenChange,
  onApply,
  onRemove,
}: {
  open: boolean
  initialUrl: string
  onOpenChange: (open: boolean) => void
  onApply: (url: string) => void
  onRemove: () => void
}) {
  const [urlDraft, setUrlDraft] = React.useState(initialUrl)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setUrlDraft(initialUrl)
    setErrorMessage(null)
  }, [initialUrl, open])

  const handleApply = () => {
    const trimmedUrl = urlDraft.trim()
    if (!trimmedUrl) {
      setErrorMessage(knowledgeBasePageCopy.articleLinkInvalidUrlLabel)
      return
    }

    if (!isValidUrl(trimmedUrl)) {
      setErrorMessage(knowledgeBasePageCopy.articleLinkInvalidUrlLabel)
      return
    }

    onApply(trimmedUrl)
    onOpenChange(false)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-[70] bg-black/32 transition-opacity duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity] data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none supports-backdrop-filter:backdrop-blur-sm" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-[71] flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-border/70 bg-background/96 p-0 text-popover-foreground shadow-2xl outline-none transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[transform,opacity] data-ending-style:translate-y-[calc(-50%+1rem)] data-ending-style:opacity-0 data-starting-style:translate-y-[calc(-50%+1rem)] data-starting-style:opacity-0 motion-reduce:transition-none supports-backdrop-filter:backdrop-blur-xl">
          <div className="px-6 pt-6 pb-4">
            <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
              {knowledgeBasePageCopy.articleLinkDialogTitle}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-muted-foreground">
              {knowledgeBasePageCopy.articleLinkDialogDescription}
            </DialogPrimitive.Description>
          </div>

          <div className="space-y-2 px-6 pb-5">
            <Label htmlFor="article-link-url">
              {knowledgeBasePageCopy.articleLinkPromptLabel}
            </Label>
            <Input
              id="article-link-url"
              value={urlDraft}
              onChange={(event) => {
                setUrlDraft(event.target.value)
                setErrorMessage(null)
              }}
              placeholder={knowledgeBasePageCopy.articleLinkDialogPlaceholder}
              className="h-10 rounded-xl"
            />
            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/70 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => {
                onRemove()
                onOpenChange(false)
              }}
            >
              {knowledgeBasePageCopy.articleLinkDialogRemoveLabel}
            </Button>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                {knowledgeBasePageCopy.articleCancelLabel}
              </Button>
              <Button type="button" className="rounded-xl" onClick={handleApply}>
                {knowledgeBasePageCopy.articleLinkDialogSaveLabel}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function KnowledgeArticleEditorToolbar({ editor }: { editor: Editor | null }) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = React.useState(false)
  const [linkDraft, setLinkDraft] = React.useState("")

  const openLinkDialog = React.useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes("link").href
    setLinkDraft(typeof previousUrl === "string" ? previousUrl : "")
    setIsLinkDialogOpen(true)
  }, [editor])

  const applyLink = React.useCallback(
    (url: string) => {
      editor
        ?.chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run()
    },
    [editor]
  )

  const removeLink = React.useCallback(() => {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run()
  }, [editor])

  if (!editor) return null

  return (
    <>
      <div
        role="toolbar"
        aria-label={knowledgeBasePageCopy.articleToolbarAriaLabel}
        className="flex flex-wrap items-center gap-1 rounded-2xl border bg-card/40 p-2"
      >
      <ToolbarButton
        label={knowledgeBasePageCopy.articleToolbarBoldLabel}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <IconBold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={knowledgeBasePageCopy.articleToolbarItalicLabel}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <IconItalic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={knowledgeBasePageCopy.articleToolbarUnderlineLabel}
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <IconUnderline className="size-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <ToolbarButton
        label={knowledgeBasePageCopy.articleToolbarHeadingTwoLabel}
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <IconH2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={knowledgeBasePageCopy.articleToolbarHeadingThreeLabel}
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <IconH3 className="size-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <ToolbarButton
        label={knowledgeBasePageCopy.articleToolbarBulletListLabel}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <IconList className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={knowledgeBasePageCopy.articleToolbarNumberedListLabel}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <IconListNumbers className="size-4" />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <ToolbarButton
        label={knowledgeBasePageCopy.articleToolbarLinkLabel}
        active={editor.isActive("link")}
        onClick={openLinkDialog}
      >
        <IconLink className="size-4" />
      </ToolbarButton>
      </div>

      <ArticleLinkDialog
        open={isLinkDialogOpen}
        initialUrl={linkDraft}
        onOpenChange={setIsLinkDialogOpen}
        onApply={applyLink}
        onRemove={removeLink}
      />
    </>
  )
}

function KnowledgeArticleEditor({
  articleId,
  value,
  onChange,
}: {
  articleId: string
  value: JSONContent
  onChange: (value: JSONContent) => void
}) {
  const editor = useEditor({
    extensions: editorExtensions,
    content: value,
    editorProps: {
      attributes: {
        class: "min-h-[320px] outline-none",
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getJSON())
    },
  })

  React.useEffect(() => {
    editor?.commands.setContent(value, { emitUpdate: false })
  }, [articleId, editor, value])

  return (
    <div className="flex flex-col gap-4">
      <KnowledgeArticleEditorToolbar editor={editor} />
      <div className="min-h-[360px] rounded-2xl border bg-background px-5 py-4 text-base leading-8 text-foreground/85 [&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_blockquote]:rounded-2xl [&_.ProseMirror_blockquote]:border [&_.ProseMirror_blockquote]:bg-muted/30 [&_.ProseMirror_blockquote]:px-5 [&_.ProseMirror_blockquote]:py-4 [&_.ProseMirror_blockquote]:text-base [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:leading-tight [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:tracking-tight [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:leading-tight [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:tracking-tight [&_.ProseMirror_ol]:my-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_p]:my-3 [&_.ProseMirror_ul]:my-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export function KnowledgeBaseArticleDetail({
  article,
  activeTab,
  startInEditMode = false,
  onEditModeStarted,
  onTabChange,
  onSaveArticle,
  onUnsavedChangesChange,
}: KnowledgeBaseArticleDetailProps) {
  const [showLinkCopied, setShowLinkCopied] = React.useState(false)
  const {
    isEditing,
    setIsEditing,
    isPreviewingDraft,
    setIsPreviewingDraft,
    showDiscardDialog,
    setShowDiscardDialog,
    showSaveSuccess,
    draftDocument,
    setDraftDocument,
    draftTitle,
    setDraftTitle,
    draftStatus,
    setDraftStatus,
    hasUnsavedChanges,
    discardEdits,
    handleSave,
    handleCancel,
    handleTabChangeGuard,
    displayedDocument,
    displayedTitle,
    headerTitle,
  } = useKnowledgeArticleEditor({
    article,
    startInEditMode,
    onEditModeStarted,
    onSaveArticle,
    onUnsavedChangesChange,
  })

  React.useEffect(() => {
    if (!showLinkCopied) return

    const timeoutId = window.setTimeout(() => {
      setShowLinkCopied(false)
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [showLinkCopied])

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return

    const nextUrl = `${window.location.origin}/knowledge-base?article=${article.id}`

    try {
      await navigator.clipboard.writeText(nextUrl)
      setShowLinkCopied(true)
    } catch {
      setShowLinkCopied(false)
    }
  }

  return (
    <>
    <Tabs
      value={activeTab}
      onValueChange={(nextTab) =>
        handleTabChangeGuard(nextTab, (value) =>
          onTabChange(value as ArticleDetailTab)
        )
      }
      className="flex h-full min-h-0 flex-1 flex-col gap-0 overflow-hidden"
    >
      <div className="z-10 shrink-0 border-b bg-background">
        <div className="px-6 py-4">
          <div className="flex w-full items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {isEditing ? (
                <Input
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  placeholder={knowledgeBasePageCopy.articleTitlePlaceholder}
                  className="h-10 rounded-xl text-xl font-semibold tracking-tight"
                />
              ) : (
                <p className="min-w-0 text-xl leading-tight font-semibold tracking-tight text-foreground">
                  {headerTitle}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="article-status"
                      className="text-sm text-muted-foreground"
                    >
                      {knowledgeBasePageCopy.articleStatusLabel}
                    </Label>
                    <Select
                      value={draftStatus}
                      onValueChange={(value) =>
                        setDraftStatus(value as KnowledgeArticleStatus)
                      }
                    >
                      <SelectTrigger
                        id="article-status"
                        className="h-8 w-[10.5rem] rounded-full text-xs"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {articleStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-7 rounded-full px-2.5 text-xs",
                      getArticleStatusClassName(article.status)
                    )}
                  >
                    {getArticleStatusLabel(article.status)}
                  </Badge>
                )}
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  {knowledgeBasePageCopy.articleLastEditedPrefix}{" "}
                  {article.updatedAt.replace(/^Updated\s+/i, "")} by
                  <ArticleAuthorAvatar
                    name={article.author.name}
                    avatarUrl={article.author.avatarUrl}
                  />
                  {article.author.name}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {showSaveSuccess ? (
                <span className="hidden text-xs text-emerald-600 sm:inline dark:text-emerald-300">
                  {knowledgeBasePageCopy.articleSaveSuccessLabel}
                </span>
              ) : null}
              {showLinkCopied ? (
                <span className="hidden text-xs text-emerald-600 sm:inline dark:text-emerald-300">
                  {knowledgeBasePageCopy.articleLinkCopiedLabel}
                </span>
              ) : null}
              {isEditing && hasUnsavedChanges ? (
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {knowledgeBasePageCopy.articleUnsavedLabel}
                </span>
              ) : null}
              {isEditing && !hasUnsavedChanges ? (
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {knowledgeBasePageCopy.articleNoChangesLabel}
                </span>
              ) : null}

              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-xl px-3"
                    onClick={() =>
                      setIsPreviewingDraft((isPreviewing) => !isPreviewing)
                    }
                  >
                    <IconEye className="size-4" />
                    {knowledgeBasePageCopy.articlePreviewLabel}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl px-3"
                    onClick={handleCancel}
                  >
                    {knowledgeBasePageCopy.articleCancelLabel}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 rounded-xl px-3"
                    onClick={handleSave}
                  >
                    {knowledgeBasePageCopy.articleSaveLabel}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-xl px-3"
                  onClick={() => setIsEditing(true)}
                >
                  <IconPencil className="size-4" />
                  {knowledgeBasePageCopy.articleEditLabel}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="size-10 rounded-xl"
                    />
                  }
                >
                  <IconDots className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => void handleCopyLink()}>
                      {knowledgeBasePageCopy.articleCopyLinkLabel}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="px-6">
          <TabsList
            variant="line"
            className="w-full justify-start gap-1 rounded-none p-0"
          >
            {articleDetailTabs.map((tab) => {
              const TabIcon = tab.icon

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={isEditing && tab.value !== "content"}
                  className="flex-none gap-2 px-4"
                >
                  <TabIcon className="size-4" />
                  {tab.value === "comments" ? (
                    <>
                      <span>{tab.label}</span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {article.commentsCount ?? 3}
                      </span>
                    </>
                  ) : (
                    tab.label
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>
      </div>

      <TabsContent
        value="content"
        className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
            {isEditing && !isPreviewingDraft ? (
              <KnowledgeArticleEditor
                articleId={article.id}
                value={draftDocument}
                onChange={setDraftDocument}
              />
            ) : (
              <KnowledgeArticleContentView
                article={article}
                document={displayedDocument}
                title={displayedTitle.trim() || article.title}
              />
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent
        value="insights"
        className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border bg-card/50 p-5">
                <div className="text-sm text-muted-foreground">
                  {knowledgeBasePageCopy.insightsViewsLabel}
                </div>
                <div className="mt-2 text-3xl font-semibold tracking-tight">
                  {article.views}
                </div>
              </div>
              <div className="rounded-3xl border bg-card/50 p-5">
                <div className="text-sm text-muted-foreground">
                  {knowledgeBasePageCopy.insightsHelpfulRateLabel}
                </div>
                <div className="mt-2 text-3xl font-semibold tracking-tight">
                  {article.helpfulRate}%
                </div>
              </div>
              <div className="rounded-3xl border bg-card/50 p-5">
                <div className="text-sm text-muted-foreground">
                  {knowledgeBasePageCopy.insightsLinkedTicketsLabel}
                </div>
                <div className="mt-2 text-3xl font-semibold tracking-tight">
                  {article.linkedTickets}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border bg-card/50 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">
                  {knowledgeBasePageCopy.insightsMatchSignalsLabel}
                </h2>
                <Badge variant="outline" className="h-7 rounded-full px-3 capitalize">
                  {knowledgeBasePageCopy.insightsCategoryLabel}:{" "}
                  {getCategoryLabel(article.category)}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {article.matchReasons.map((reason) => (
                  <Badge key={reason} variant="outline" className="h-7 rounded-full px-3">
                    {reason}
                  </Badge>
                ))}
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                {knowledgeBasePageCopy.insightsEmptyDescription}
              </p>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent
        value="comments"
        className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-4xl rounded-3xl border border-dashed bg-card/50 p-6">
            <h2 className="text-xl font-semibold tracking-tight">
              {knowledgeBasePageCopy.commentsEmptyTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {knowledgeBasePageCopy.commentsEmptyDescription}
            </p>
          </div>
        </div>
      </TabsContent>

      <TabsContent
        value="activity"
        className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-4xl rounded-3xl border border-dashed bg-card/50 p-6">
            <h2 className="text-xl font-semibold tracking-tight">
              {knowledgeBasePageCopy.activityEmptyTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {knowledgeBasePageCopy.activityEmptyDescription}
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>

    <ConfirmDialog
      open={showDiscardDialog}
      onOpenChange={setShowDiscardDialog}
      title={knowledgeBasePageCopy.articleDiscardTitle}
      description={knowledgeBasePageCopy.articleDiscardDescription}
      confirmLabel={knowledgeBasePageCopy.articleDiscardConfirmLabel}
      cancelLabel={knowledgeBasePageCopy.articleCancelLabel}
      confirmVariant="destructive"
      onConfirm={discardEdits}
    />
    </>
  )
}
