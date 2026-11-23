/**
 * The icon dictionary of `Foundations/Icons`: what each icon means, by group.
 * Every icon a DS component draws or JustRAG imports (icon-usage.json) has a
 * row here — `icon-usage.test.ts` fails on one that has none, so a new icon
 * in use needs a meaning before it ships. Names are lucide's current names;
 * `Spinner` is the DS component.
 */

/** One row: the meaning and the icons that carry it. */
export interface DictionaryEntry {
  meaning: string;
  icons: string[];
  /** Where it applies, or what to prefer — `code` in backticks. */
  note?: string;
}

export interface DictionaryGroup {
  group: string;
  entries: DictionaryEntry[];
}

export const ICON_DICTIONARY: DictionaryGroup[] = [
  {
    group: "Actions",
    entries: [
      { meaning: "Add, create", icons: ["Plus"] },
      { meaning: "Delete", icons: ["Trash2"], note: "always with a destructive `Button` variant" },
      { meaning: "Close; remove from a list", icons: ["X"] },
      { meaning: "Edit, rename", icons: ["Pencil", "PenLine"], note: "prefer `Pencil`; `PenLine` (`Edit3`) is the older glyph" },
      { meaning: "New chat", icons: ["SquarePen"], note: "the head of the history column" },
      { meaning: "Start a chat with this", icons: ["MessageSquarePlus"], note: "from search, or offered as an entry" },
      { meaning: "Search", icons: ["Search"] },
      { meaning: "Download / upload", icons: ["Download", "Upload"] },
      { meaning: "Copy", icons: ["Copy"] },
      { meaning: "Save", icons: ["Save"] },
      { meaning: "Save as a template", icons: ["Bookmark"] },
      { meaning: "Reload, retry", icons: ["RefreshCw", "RotateCw"], note: "prefer `RefreshCw`" },
      { meaning: "Reset to the default", icons: ["RotateCcw"] },
      { meaning: "Undo / redo", icons: ["Undo2", "Redo2"] },
      { meaning: "Settings of an item", icons: ["Settings"] },
      { meaning: "View options (columns, layout)", icons: ["SlidersHorizontal"] },
      { meaning: "Filter a list", icons: ["ListFilter", "Funnel"], note: "`SidebarFilterMenu` draws `ListFilter`; `Funnel` (`Filter`) in the data explorer" },
      { meaning: "Sort", icons: ["ArrowUpDown"] },
      { meaning: "Select several / select all", icons: ["ListChecks", "CheckCheck"] },
      { meaning: "More actions", icons: ["Ellipsis"], note: "`ActionMenu`'s trigger (`MoreHorizontal`)" },
      { meaning: "Opens another page of the app", icons: ["ArrowUpRight"], note: "`ActionMenu` `opensPage`" },
      { meaning: "Opens outside the app, a new tab", icons: ["ExternalLink", "SquareArrowOutUpRight"], note: "prefer `ExternalLink`" },
      { meaning: "Share, members", icons: ["Users", "UserPlus"] },
      { meaning: "Pause / run, resume", icons: ["Pause", "Play"] },
      { meaning: "Turn on / off", icons: ["ToggleRight", "ToggleLeft"] },
      { meaning: "Disable", icons: ["Ban"] },
      { meaning: "Generate, revise with AI", icons: ["Sparkles", "WandSparkles"] },
      { meaning: "Rate an answer", icons: ["ThumbsUp", "ThumbsDown"] },
      { meaning: "Compare side by side", icons: ["Columns2"], note: "an answer's branches" },
      { meaning: "Show the knowledge graph", icons: ["Network"] },
      { meaning: "Quote, cite", icons: ["Quote"] },
      { meaning: "Zoom in / out; unfold / fold code", icons: ["Plus", "Minus"], note: "`ImageViewer`, `PdfViewer`, `CodeBlock`" },
      { meaning: "Pick a colour from the screen", icons: ["Pipette"], note: "`ColorField`" },
      { meaning: "Log out", icons: ["LogOut"] },
    ],
  },
  {
    group: "Composer",
    entries: [
      { meaning: "Send", icons: ["ArrowUp", "CornerDownLeft"], note: "JustRAG's composer sends with `ArrowUp`; `PromptInput`'s default submit glyph is `CornerDownLeft`" },
      { meaning: "Try it out", icons: ["SendHorizontal"], note: "a start-page draft" },
      { meaning: "Stop the answer", icons: ["Square"], note: "`PromptInput` while streaming" },
      { meaning: "Attach a file / an image", icons: ["Paperclip", "Image"] },
      { meaning: "Dictate / talk", icons: ["Mic", "AudioLines"], note: "`PromptInput`" },
      { meaning: "Suggestions", icons: ["Lightbulb"], note: "`PromptSuggestions`" },
    ],
  },
  {
    group: "Sidebar: sections and rows",
    entries: [
      { meaning: "Fold / unfold a section", icons: ["ChevronDown", "ChevronRight"], note: "`SidebarSection`, also `Accordion`" },
      { meaning: "Fold the other sections", icons: ["ChevronsDownUp"] },
      { meaning: "New section", icons: ["FolderPlus"] },
      { meaning: "Move up / down", icons: ["ArrowUp", "ArrowDown"], note: "a section or a row, in its menu" },
      { meaning: "Move a row into / out of a section", icons: ["FolderInput", "FolderMinus"] },
      { meaning: "Pin / unpin a row", icons: ["Pin", "PinOff"] },
      { meaning: "Drag to reorder", icons: ["GripVertical", "GripHorizontal"], note: "`Sortable`'s handles" },
      { meaning: "The chosen option in a menu", icons: ["Check", "Circle"], note: "`Check` in menus and `Select`; `Circle` marks a radio item (`ContextMenu`)" },
      {
        meaning: "A row's kind: chat, document, research, academic, task",
        icons: ["MessageSquare", "FileText", "Search", "GraduationCap", "MessagesSquare"],
        note: "a history row's icon",
      },
      { meaning: "A branched chat", icons: ["GitBranch"], note: "instead of the kind's icon" },
      { meaning: "Favourite", icons: ["Star"] },
      { meaning: "History, versions", icons: ["History"] },
    ],
  },
  {
    group: "Main navigation: the overview's pages",
    entries: [
      { meaning: "Suchen", icons: ["Search"], note: "opens the search palette" },
      { meaning: "Mein Wissen", icons: ["House"], note: "also on a chat of its topics" },
      { meaning: "Geteiltes Wissen", icons: ["Users"], note: "also on a chat of its topics" },
      { meaning: "Entdecken", icons: ["Compass"], note: "also on a chat of its topics" },
    ],
  },
  {
    group: "Navigation and panels",
    entries: [
      { meaning: "Back, previous (a direction)", icons: ["ChevronLeft"], note: "history, pagination, `BreadcrumbBack`" },
      { meaning: "Back to a page / forward", icons: ["ArrowLeft", "ArrowRight"], note: "JustRAG's back links; `Carousel`'s previous / next. The DS's way back is `BreadcrumbBack`" },
      { meaning: "Previous / next (a page, a match)", icons: ["ChevronUp", "ChevronDown"], note: "`PdfViewer`, a table's rows" },
      { meaning: "Open / close the left column", icons: ["PanelLeftOpen", "PanelLeftClose"], note: "`AppShell`, `SidePanel`" },
      { meaning: "Open / close the right column", icons: ["PanelRightOpen", "PanelRightClose"], note: "`AppShell`, `SidePanel`" },
      { meaning: "Open the floating right card", icons: ["SquareMenu"], note: "`AppShell`'s default toggle" },
      { meaning: "Open the navigation drawer (narrow)", icons: ["TextAlignStart", "Menu"], note: "`AppShell` draws `TextAlignStart`; `Menu` is JustRAG's mobile tab" },
      { meaning: "Mobile tabs: the page / the files", icons: ["LayoutGrid", "FolderOpen"] },
      { meaning: "Cards / list view", icons: ["LayoutGrid", "List"] },
      { meaning: "Details as a side panel / inline", icons: ["PanelRight", "Rows3"] },
      { meaning: "Edit the layout", icons: ["PanelsTopLeft"], note: "web results (`Layout`)" },
      { meaning: "Full screen / leave it", icons: ["Maximize2", "Minimize2"] },
      { meaning: "Show / hide", icons: ["Eye", "EyeOff"] },
    ],
  },
  {
    group: "Status",
    entries: [
      { meaning: "Information", icons: ["Info"] },
      { meaning: "Success", icons: ["CircleCheck", "CircleCheckBig"], note: "`Alert`'s tone draws `CircleCheck`; `CircleCheckBig` (`CheckCircle`) in JustRAG's health page" },
      { meaning: "Warning", icons: ["TriangleAlert"] },
      { meaning: "Error", icons: ["CircleX", "CircleAlert"], note: "`Alert`'s tone draws `CircleX`; `CircleAlert` (`AlertCircle`) is the inline error beside a field" },
      { meaning: "Flagged as suspicious", icons: ["ShieldAlert"], note: "a source with an injection attempt" },
      { meaning: "Locked", icons: ["Lock"] },
      { meaning: "Loading", icons: ["Spinner", "LoaderCircle"], note: "the `Spinner` component; `LoaderCircle` (`Loader2`) is its glyph — not drawn bare" },
      { meaning: "Waiting, pending; a time", icons: ["Hourglass", "Clock"] },
      { meaning: "Offline, could not load", icons: ["CloudOff"] },
      { meaning: "No results", icons: ["SearchX"] },
      { meaning: "Partly selected", icons: ["Minus"], note: "`Checkbox`, indeterminate" },
    ],
  },
  {
    group: "Sources and files",
    entries: [
      { meaning: "A file, by type", icons: ["File", "FileText", "FileType", "FilePen", "FileSpreadsheet", "Presentation"], note: "any · PDF · text, Markdown · Word, ODT · spreadsheet, CSV · slides" },
      { meaning: "A media or data file", icons: ["FileImage", "FileHeadphone", "FilePlay", "FileCode", "FileBraces"], note: "image · audio · video · YAML · JSON" },
      { meaning: "A source from the web", icons: ["Globe", "Link", "Rss"], note: "crawled site · web search result · feed" },
      { meaning: "A source from a tool", icons: ["BookOpen", "Type", "Bot", "Telescope"], note: "Confluence · inserted text · research · deep web search" },
      { meaning: "Drop files here", icons: ["CloudUpload"], note: "`FileDropzone`" },
      { meaning: "The sources of an answer", icons: ["Book", "TextQuote"], note: "`Sources`; a quoted passage in search" },
      { meaning: "A question in the citations", icons: ["MessageCircleQuestionMark"] },
      { meaning: "A table column: number / text / link", icons: ["Hash", "Type", "Link2"] },
    ],
  },
  {
    group: "An answer's steps",
    entries: [
      { meaning: "Thinking", icons: ["Brain"], note: "`ChainOfThought`, `Reasoning`" },
      { meaning: "Plan, decide, check", icons: ["ListTree", "Signpost", "Scale"] },
      { meaning: "Search files, read, list", icons: ["FileSearch", "BookOpen", "CalendarClock"] },
      { meaning: "Use a tool, an attachment, the graph", icons: ["Wrench", "Paperclip", "Network"] },
      { meaning: "Any other step", icons: ["Dot"], note: "`ChainOfThought`" },
    ],
  },
  {
    group: "Charts",
    entries: [{ meaning: "Chart type", icons: ["ChartColumn", "ChartLine", "ChartArea", "ChartPie", "ChartScatter"], note: "the data explorer" }],
  },
  {
    group: "Text formatting",
    entries: [
      { meaning: "Bold, italic, strikethrough, inline code", icons: ["Bold", "Italic", "Strikethrough", "Code"], note: "`RichTextEditor`" },
      { meaning: "Headings", icons: ["Heading1", "Heading2", "Heading3"] },
      { meaning: "Lists and indent", icons: ["List", "ListOrdered", "ListIndentIncrease", "ListIndentDecrease"] },
      { meaning: "Quote, code block, table", icons: ["TextQuote", "SquareCode", "Table"] },
    ],
  },
  {
    group: "People, roles and access",
    entries: [
      { meaning: "A person, a profile", icons: ["User", "UserRound"] },
      { meaning: "A topic's roles: owner, admin, editor, reader", icons: ["Crown", "Shield", "Pencil", "Eye"] },
      { meaning: "Platform roles: superadmin, API user", icons: ["ShieldCheck", "KeyRound"], note: "admin and user as above" },
      { meaning: "Invite by username / by link", icons: ["AtSign", "Link2"] },
      { meaning: "Managers of an item", icons: ["UserCog"] },
      { meaning: "API keys", icons: ["Key"] },
      { meaning: "An assistant role's own icon", icons: ["UserRound", "Building2", "FileCheck", "LifeBuoy", "Sparkles"], note: "chosen per role" },
    ],
  },
  {
    group: "Settings and admin",
    entries: [
      { meaning: "Accessibility, help", icons: ["Accessibility", "LifeBuoy"], note: "the user menu" },
      { meaning: "Connections, integrations", icons: ["Plug"] },
      { meaning: "Sign-in, roles", icons: ["ShieldCheck", "ShieldUser"] },
      { meaning: "Health, AI models, server, storage", icons: ["Activity", "Cpu", "Server", "HardDrive"] },
      { meaning: "Topics overview, templates, tags", icons: ["Database", "Blocks", "Tag"] },
      { meaning: "System notice", icons: ["Megaphone"] },
      { meaning: "Evaluations, workflow", icons: ["FlaskConical", "Workflow"] },
    ],
  },
];
