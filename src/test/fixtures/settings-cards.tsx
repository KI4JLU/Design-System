import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/card";
import { FormControl, FormDescription, FormItem, FormLabel } from "../../components/form";
import { Input } from "../../components/input";

/**
 * The settings cards of the justCampus transcription module (up to ten on the
 * real page) — long enough that a form's action row scrolls out of view.
 * Shared by the FormActionBar and FormLayout stories.
 */
const SECTIONS: { title: string; description: string; fields: [string, string, string?][] }[] = [
  {
    title: "Allgemein",
    description: "Name und Beschreibung in der Seitenleiste.",
    fields: [["Name", "Transkription"], ["Beschreibung", "Audio und Video in Text umwandeln"]],
  },
  {
    title: "Zugangsdaten",
    description: "Schlüssel für den Transkriptionsdienst.",
    fields: [["API-Schlüssel", "", "Leer lassen, um den gespeicherten Schlüssel zu behalten."]],
  },
  {
    title: "Modell",
    description: "Welches Modell die Aufnahmen verschriftlicht.",
    fields: [["Modell", "whisper-large-v3"], ["Endpunkt", "https://asr.uni-giessen.de/v1"]],
  },
  {
    title: "Sprachen",
    description: "Erkannte und angebotene Sprachen.",
    fields: [["Standardsprache", "Deutsch"]],
  },
  {
    title: "Grenzen",
    description: "Obergrenzen je Datei und Nutzerin.",
    fields: [["Maximale Dateigröße (MB)", "500"], ["Maximale Dauer (Minuten)", "180"]],
  },
  {
    title: "Speicherdauer",
    description: "Wie lange Aufnahmen und Texte aufbewahrt werden.",
    fields: [["Aufbewahrung (Tage)", "30"]],
  },
];

export function SettingsCards({ count = SECTIONS.length }: { count?: number }) {
  return (
    <>
      {SECTIONS.slice(0, count).map((section) => (
        <Card key={section.title} data-testid="settings-card">
          <CardHeader>
            <CardTitle asChild>
              <h2>{section.title}</h2>
            </CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-stack-md">
            {section.fields.map(([label, value, hint]) => (
              <FormItem key={label}>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input defaultValue={value} />
                </FormControl>
                {hint && <FormDescription>{hint}</FormDescription>}
              </FormItem>
            ))}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
