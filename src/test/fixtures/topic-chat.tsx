import { useState } from "react";
import {
  ArrowUp,
  Brain,
  ChevronDown,
  Download,
  FileText,
  Info,
  RefreshCw,
  Search,
  ThumbsDown,
  ThumbsUp,
  WandSparkles,
} from "lucide-react";
import { Badge } from "../../components/badge";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "../../components/chain-of-thought";
import { ChatStage } from "../../components/chat-stage";
import { InputGroupAddon } from "../../components/input-group";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from "../../components/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "../../components/message-scroller";
import {
  PromptInput,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputActionMenuTrigger,
  PromptInputButton,
  PromptInputSubmit,
} from "../../components/prompt-input";
import { PromptInputAdaptiveTextarea } from "../../components/prompt-input-adaptive-textarea";
import { PromptSuggestions } from "../../components/prompt-suggestions";
import { Source, Sources, SourcesContent, SourcesTrigger } from "../../components/sources";

/* ---------------------------------------------------------------------------
 * Story fixture — the main area of the topic view, as JLURAG's
 * `ChatView.tsx` and `MessageBubble.tsx` render it (`development`, Nov 2026),
 * built from DS parts only. Three states, one per story:
 *
 *  - `TopicConversation` — a chat with answers (`TopicView`);
 *  - `TopicStart` — a new chat in a topic that has sources: the topic's
 *    start page, centred (`TopicNewChat`);
 *  - `TopicNew` — a new topic without sources (`TopicWithoutSources`).
 *
 * JLURAG's own pieces are left out or replaced by the nearest DS part: the
 * start page's title card and glow (`StartPageParts.tsx`), the verification
 * chip (`ConfidenceChip`) — here a `Badge` — and the citation chips in the
 * answer. JLURAG sizes the reading column in its own CSS (`.chat-column`:
 * 80% of the column, at most 60rem, 2rem inset); the fixture uses the same
 * numbers as classes. Not part of the package.
 * ------------------------------------------------------------------------- */

/**
 * The topic the page shows. The page stories pass it to the fixture's
 * breadcrumb (`topic`), so bar and page name the same topic.
 */
export const TOPIC_NAME = "Prüfungsordnung Informatik";

/** JLURAG's answer disclaimer under the composer (`chatFooter`). */
export const CHAT_FOOTER =
  "Antworten werden basierend auf deinen hochgeladenen Quellen generiert. Die KI kann Fehler machen, überprüfe wichtige Informationen.";

/**
 * The answer's markdown. `MessageResponse` renders its children as given — the
 * app brings its own markdown styles (JLURAG: `index.css`, h2 24px, h3 18px,
 * disc lists); these classes stand in for them.
 */
const MARKDOWN =
  "leading-relaxed [&_h2]:mt-1 [&_h2]:mb-3 [&_h2]:font-headline-md [&_h2]:text-headline-md [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-1 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6";

/** JLURAG's reading column: 80% of the column, at most 60rem, a 2rem inset. */
const COLUMN = "mx-auto w-full max-w-[min(80%,60rem)] px-8";
/** The start page's column: the title card's width (`max-w-2xl`), a 1rem inset. */
const START_COLUMN = "mx-auto w-full max-w-2xl px-4";

/**
 * The composer as JLURAG mounts it (`ChatView.tsx`): the „+" menu at the
 * bottom start, reasoning, „improve the draft", the topic's document count
 * and send at the bottom end, all over the frame; the field keeps one line
 * between them. The same composition as `PromptInputAdaptiveTextarea →
 * ChatComposer`.
 */
export function TopicComposer({ documents = 1 }: { documents?: number }) {
  const [value, setValue] = useState("");
  return (
    <PromptInput onSubmit={() => setValue("")}>
      <InputGroupAddon align="inline-start" className="absolute bottom-1 left-3 p-0">
        <PromptInputActionMenu>
          <PromptInputActionMenuTrigger className="size-10" aria-label="Dateien anhängen" />
          <PromptInputActionMenuContent align="start">
            <PromptInputActionMenuItem>Fotos oder Dateien hinzufügen</PromptInputActionMenuItem>
          </PromptInputActionMenuContent>
        </PromptInputActionMenu>
      </InputGroupAddon>
      <PromptInputAdaptiveTextarea
        aria-label="Nachricht"
        className="px-4 text-base leading-normal"
        placeholder={`Stelle eine Frage zu ${TOPIC_NAME}...`}
        rows={1}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        inlineLeft={72}
        inlineRight={212}
        laneHeight={48}
        maxHeight={240}
      />
      <InputGroupAddon align="inline-end" className="absolute right-3 bottom-1 gap-1 p-0">
        <PromptInputButton aria-label="Denkmodus" aria-pressed={false}>
          <Brain aria-hidden="true" />
        </PromptInputButton>
        <PromptInputButton aria-label="Entwurf verbessern" disabled={!value.trim()}>
          <WandSparkles aria-hidden="true" />
        </PromptInputButton>
        <span
          className="inline-flex items-center gap-1 px-2 text-sm whitespace-nowrap text-on-surface-variant"
          aria-label={`${documents} ${documents === 1 ? "Dokument" : "Dokumente"}`}
        >
          <FileText size={16} aria-hidden="true" />
          <span aria-hidden="true">{documents}</span>
        </span>
        <PromptInputSubmit
          className="size-10"
          aria-label="Senden"
          disabled={!value.trim()}
          idle={!value.trim()}
        >
          <ArrowUp aria-hidden="true" />
        </PromptInputSubmit>
      </InputGroupAddon>
    </PromptInput>
  );
}

/** An answer's action row (JLURAG `MessageActions.tsx`, the four it shows at rest). */
function AnswerActions() {
  return (
    <MessageActions>
      <MessageAction tooltip="Gute Antwort">
        <ThumbsUp className="size-4" />
      </MessageAction>
      <MessageAction tooltip="Schlechte Antwort">
        <ThumbsDown className="size-4" />
      </MessageAction>
      <MessageAction tooltip="Neu generieren">
        <RefreshCw className="size-4" />
      </MessageAction>
      <MessageAction tooltip="Herunterladen">
        <Download className="size-4" />
      </MessageAction>
    </MessageActions>
  );
}

/** „1 Suche durchgeführt": the answer's steps, folded (JLURAG `agentSteps`). */
function SearchSteps() {
  return (
    <ChainOfThought>
      <ChainOfThoughtHeader>1 Suche durchgeführt</ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        <ChainOfThoughtStep
          icon={Search}
          label="Quellen durchsucht"
          description="Modulhandbuch_2026.pdf"
          status="complete"
        />
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}

/**
 * The answer's footer (JLURAG `MessageBubble.tsx`): the cited sources as a
 * fold-out list — or „Keine passenden Quellen gefunden" for an answer without
 * one — the verification state, the actions.
 */
function AnswerFooter({ cited }: { cited: number }) {
  return (
    <Sources className="mb-0">
      <MessageToolbar className="mt-2 min-h-8 flex-wrap justify-start gap-1">
        {cited > 0 ? (
          <SourcesTrigger count={cited}>
            <FileText className="size-4" aria-hidden="true" />
            <span className="font-medium">Quellen · {cited}</span>
            <ChevronDown
              className="size-4 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </SourcesTrigger>
        ) : (
          <Badge appearance="text" tone="neutral">
            <Info className="size-3.5" aria-hidden="true" />
            Keine passenden Quellen gefunden
          </Badge>
        )}
        <Badge appearance="text" tone="error">
          Nicht verifiziert
        </Badge>
        <AnswerActions />
      </MessageToolbar>
      {cited > 0 && (
        <SourcesContent className="w-full">
          <Source href="#" title="Modulhandbuch_2026.pdf" />
        </SourcesContent>
      )}
    </Sources>
  );
}

/** The day over a chat's first question. */
function DayLine({ children }: { children: string }) {
  return (
    <p className="m-0 pt-4 text-center text-sm text-on-surface-variant">{children}</p>
  );
}

/**
 * A chat with two turns: a follow-up question the sources cannot answer
 * (no cited source), and a question they do answer (one cited source).
 */
export function TopicConversation() {
  return (
    <ChatStage
      composer={
        <div className={`${COLUMN} pt-2 pb-4`}>
          <TopicComposer />
        </div>
      }
      footer={CHAT_FOOTER}
      footerId="chat-disclaimer"
    >
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className={`${COLUMN} flex flex-col`}>
              <MessageScrollerItem messageId="q1" className="py-4">
                <DayLine>Fr., 20. Nov. um 17:37</DayLine>
                <Message from="user" className="mt-4">
                  <MessageContent>Mach eine Analyse</MessageContent>
                </Message>
              </MessageScrollerItem>
              <MessageScrollerItem messageId="a1" className="py-4">
                <Message from="assistant">
                  <SearchSteps />
                  <MessageContent>
                    <MessageResponse className={MARKDOWN}>
                      <p>
                        Deine Bitte „Mach eine Analyse" ist leider zu offen, damit ich dir eine
                        gezielte Antwort geben kann. Was genau möchtest du analysiert haben? Zum
                        Beispiel:
                      </p>
                      <ul>
                        <li>
                          <strong>Die Fristen</strong> für die Anmeldung und den Rücktritt
                        </li>
                        <li>
                          <strong>Die Module</strong> des ersten Studienjahres
                        </li>
                        <li>Oder etwas ganz anderes?</li>
                      </ul>
                    </MessageResponse>
                  </MessageContent>
                  <AnswerFooter cited={0} />
                </Message>
              </MessageScrollerItem>
              <MessageScrollerItem messageId="q2" className="py-4">
                <Message from="user">
                  <MessageContent>Wann endet die Prüfungsanmeldung?</MessageContent>
                </Message>
              </MessageScrollerItem>
              <MessageScrollerItem messageId="a2" className="py-4">
                <Message from="assistant">
                  <SearchSteps />
                  <MessageContent>
                    <MessageResponse className={MARKDOWN}>
                      <h2>Prüfungsanmeldung im Wintersemester</h2>
                      <p>
                        Die Anmeldung zu den Prüfungen des Wintersemesters endet am{" "}
                        <strong>15. November</strong>. Eine Abmeldung ist bis eine Woche vor dem
                        Prüfungstermin möglich.
                      </p>
                      <h3>Was die Quellen belegen</h3>
                      <ul>
                        <li>
                          <strong>Anmeldefrist:</strong> 15. November
                        </li>
                        <li>
                          <strong>Rücktritt:</strong> bis sieben Tage vor dem Termin, ohne Angabe
                          von Gründen
                        </li>
                      </ul>
                    </MessageResponse>
                  </MessageContent>
                  <AnswerFooter cited={1} />
                </Message>
              </MessageScrollerItem>
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
    </ChatStage>
  );
}

/**
 * A new chat in a topic that has sources: the topic's start page, centred —
 * its name, the model, the document count and date, the description, then
 * the composer and the suggested questions (JLURAG `ChatView.tsx` empty state).
 */
export function TopicStart() {
  return (
    <ChatStage
      empty
      composer={
        <div className={`${START_COLUMN} pt-8 pb-4`}>
          <TopicComposer />
          <PromptSuggestions
            className="mt-4"
            title="Vorschläge"
            suggestions={[
              "Wann endet die Prüfungsanmeldung?",
              "Welche Module gehören ins erste Studienjahr?",
            ]}
            onSelect={() => {}}
            dismissible
            previousLabel="Vorherige Seite"
            nextLabel="Nächste Seite"
            dismissLabel="Schließen"
          />
        </div>
      }
      footer={CHAT_FOOTER}
      footerId="chat-disclaimer"
    >
      <div className={`${START_COLUMN} flex flex-col items-center gap-2 text-center`}>
        <h1 className="m-0 font-display-lg text-display-lg text-on-surface">{TOPIC_NAME}</h1>
        <p className="m-0 flex flex-wrap items-center justify-center gap-1.5 text-xs text-on-surface-variant">
          <Badge tone="success">Claude</Badge>
          <span aria-hidden="true">·</span>
          <span>1 Dokument</span>
          <span aria-hidden="true">·</span>
          <span>Stand 20.11.2026</span>
        </p>
        <p className="m-0 text-sm text-on-surface-variant">
          Frage mich alles, was du über deine Quellen wissen möchtest. Ich kann dir helfen,
          Zusammenfassungen zu erstellen, Informationen zu finden und Ideen zu synthetisieren.
        </p>
      </div>
    </ChatStage>
  );
}

/** JLURAG's empty-topic heading (`uploadFirstSource`). */
export const FIRST_SOURCE_TITLE = "Füge deine erste Quelle hinzu";

/**
 * A new topic, no sources yet: the call to add the first one, centred, over
 * the composer; nothing to ask about yet, so no suggestions (JLURAG
 * `ChatView.tsx`, `noSources && addSources`).
 */
export function TopicNew() {
  return (
    <ChatStage
      empty
      composer={
        <div className={`${START_COLUMN} pt-8 pb-4`}>
          <TopicComposer documents={0} />
        </div>
      }
      footer={CHAT_FOOTER}
      footerId="chat-disclaimer"
    >
      <div className={`${START_COLUMN} flex flex-col items-center gap-3 text-center`}>
        <h1 className="m-0 font-display-lg text-display-lg text-on-surface">
          {FIRST_SOURCE_TITLE}
        </h1>
        <p className="m-0 text-on-surface-variant">
          Lade ein Dokument hoch oder hol dir Inhalte aus dem Web — danach kannst du Fragen
          stellen.
        </p>
      </div>
    </ChatStage>
  );
}
