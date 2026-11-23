import { useState, type ReactNode } from "react";
import {
  Activity,
  Blocks,
  Cpu,
  Database,
  FileText,
  Globe,
  Megaphone,
  Search,
  Settings,
  ShieldCheck,
  ShieldUser,
  UserPlus,
} from "lucide-react";
import { Button } from "../../components/button";
import { Input } from "../../components/input";
import { PanelSection } from "../../components/panel-section";
import { SettingsDialog, SettingsRow, type SettingsSection } from "../../components/settings-dialog";
import { Switch } from "../../components/switch";

/* ---------------------------------------------------------------------------
 * Story fixture — JustRAG's admin console („Admin-Einstellungen",
 * `AdminUI.tsx`): a `SettingsDialog` of four groups (Konfiguration, Themen,
 * Nutzer, Monitoring) and their sections, as the app names them. The tabs'
 * content is reduced to a few rows each, built from `PanelSection` and
 * `SettingsRow` the way JustRAG builds them; „Suchanbieter" is complete.
 * Not part of the package: `src/test` is excluded from the type build.
 * ------------------------------------------------------------------------- */

export const ADMIN_SETTINGS_TITLE = "Admin-Einstellungen";

function Toggle({ label, initial = false }: { label: string; initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return <SettingsRow label={label} control={<Switch aria-label={label} checked={on} onCheckedChange={setOn} />} />;
}

function Field({ label, type = "text", placeholder }: { label: string; type?: string; placeholder?: string }) {
  return <SettingsRow label={label} control={<Input aria-label={label} type={type} placeholder={placeholder} />} />;
}

/** „Suchanbieter" — JustRAG's `AdminSearchTab.tsx`: two sections. */
function SearchProviders() {
  return (
    <div className="flex flex-col gap-6 pt-5">
      <PanelSection title="Web-Suche">
        <Toggle label="Web-Suche aktivieren" initial />
        <Field label="Google Search API-Schlüssel" type="password" placeholder="AIza…" />
        <Field label="Google Search Engine ID (CX)" placeholder="0123456789…" />
      </PanelSection>
      <PanelSection title="Akademische Recherche">
        <Toggle label="Akademische Recherche aktivieren" />
      </PanelSection>
    </div>
  );
}

const rows = (...children: ReactNode[]) => <div className="flex flex-col gap-6 pt-5">{children}</div>;

const SECTIONS: SettingsSection[] = [
  {
    value: "configs",
    label: "KI-Modelle",
    group: "Konfiguration",
    icon: <Cpu aria-hidden="true" />,
    keywords: ["Modell", "Standardmodell"],
    content: rows(
      <PanelSection key="m" title="Standardmodell" hint="Das Modell, mit dem ein neues Thema antwortet.">
        <Field label="Modell" placeholder="z. B. gpt-4o" />
      </PanelSection>,
    ),
  },
  {
    value: "auth",
    label: "Auth-Anbieter",
    group: "Konfiguration",
    icon: <ShieldCheck aria-hidden="true" />,
    keywords: ["SSO", "Shibboleth", "Anmeldung"],
    content: rows(
      <PanelSection key="a" title="Single Sign-on">
        <Toggle label="Anmeldung über die Hochschule" initial />
      </PanelSection>,
    ),
  },
  {
    value: "search",
    label: "Suchanbieter",
    group: "Konfiguration",
    icon: <Search aria-hidden="true" />,
    keywords: ["Web-Suche", "Google", "Akademische Recherche"],
    content: <SearchProviders />,
  },
  {
    value: "agent",
    label: "Agenten",
    group: "Konfiguration",
    icon: <FileText aria-hidden="true" />,
    content: rows(
      <PanelSection key="g" title="Recherche-Agent">
        <Toggle label="Recherche-Agent anbieten" initial />
      </PanelSection>,
    ),
  },
  {
    value: "site",
    label: "Einstellungen",
    group: "Konfiguration",
    icon: <Settings aria-hidden="true" />,
    keywords: ["Namen", "Richtlinien"],
    content: rows(
      <PanelSection key="n" title="Namen">
        <Field label="Name der Anwendung" placeholder="JustRAG" />
      </PanelSection>,
      <PanelSection key="r" title="Richtlinien">
        <Toggle label="Nutzungsbedingungen bestätigen lassen" initial />
      </PanelSection>,
    ),
  },
  {
    value: "notice",
    label: "Systemmeldung",
    group: "Konfiguration",
    icon: <Megaphone aria-hidden="true" />,
    content: rows(
      <PanelSection key="s" title="Systemmeldung" hint="Ein Banner über der ganzen Anwendung, für alle Nutzer.">
        <Toggle label="Systemmeldung anzeigen" />
      </PanelSection>,
    ),
  },
  {
    value: "kb-overview",
    label: "KB-Übersicht",
    group: "Themen",
    icon: <Database aria-hidden="true" />,
    content: rows(<SettingsRow key="k" label="Themen gesamt" control={<span className="text-on-surface-variant">128</span>} />),
  },
  {
    value: "global-kbs",
    label: "Globale KBs",
    group: "Themen",
    icon: <Globe aria-hidden="true" />,
    content: rows(<SettingsRow key="k" label="Öffentliche Themen" control={<span className="text-on-surface-variant">12</span>} />),
  },
  {
    value: "templates",
    label: "Vorlagen",
    group: "Themen",
    icon: <Blocks aria-hidden="true" />,
    content: rows(<SettingsRow key="k" label="Vorlagen" control={<Button variant="outline">Neue Vorlage</Button>} />),
  },
  {
    value: "users",
    label: "Benutzer",
    group: "Nutzer",
    icon: <UserPlus aria-hidden="true" />,
    content: rows(<Field key="u" label="Benutzer suchen" placeholder="Name oder Kennung" />),
  },
  {
    value: "roles",
    label: "Rollen & Rechte",
    group: "Nutzer",
    icon: <ShieldUser aria-hidden="true" />,
    content: rows(<SettingsRow key="r" label="Rollen" control={<span className="text-on-surface-variant">4</span>} />),
  },
  {
    value: "health",
    label: "System Health",
    group: "Monitoring",
    icon: <Activity aria-hidden="true" />,
    content: rows(<SettingsRow key="h" label="Status" control={<span className="text-success">Alle Dienste laufen</span>} />),
  },
  {
    value: "eval",
    label: "Evaluation-Runner",
    group: "Monitoring",
    icon: <Activity aria-hidden="true" />,
    content: rows(<SettingsRow key="e" label="Letzter Lauf" control={<span className="text-on-surface-variant">gestern</span>} />),
  },
];

/** The admin console as a window; `initiallyOpen` for a story that shows it open. */
export function AdminSettingsDialog({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{ADMIN_SETTINGS_TITLE} öffnen</Button>
      <SettingsDialog open={open} onOpenChange={setOpen} title={ADMIN_SETTINGS_TITLE} size="xl" sections={SECTIONS} />
    </>
  );
}
