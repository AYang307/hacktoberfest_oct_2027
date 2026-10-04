import type { Draft, PrefillDraft } from "./types";

export const MAX_ANNOUNCEMENT = 8000;

export function parseTags(text: string): string[] {
  return [...new Set(text.split(",").map(t => t.trim()).filter(Boolean))].slice(0, 8).map(t => t.slice(0, 30));
}

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export function draftErrors(draft: Draft): string[] {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push(draft.kind === "event" ? "Add an event title." : "Add a group name.");
  if (draft.title.length > 100) errors.push("Keep the title under 100 characters.");
  if (draft.description.length > 2000) errors.push("Keep the description under 2,000 characters.");
  if (draft.kind === "group" && !draft.description.trim()) errors.push("Add a group description.");
  if (draft.kind === "event") {
    if (!draft.location.trim()) errors.push("Add the event location.");
    if (!validDate(draft.date)) errors.push("Add a valid event date.");
    if (!validTime(draft.time)) errors.push("Add a valid event time.");
  }
  return errors;
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Treat the model response as untrusted, even with a structured-output schema.
export function validateExtraction(value: unknown): PrefillDraft[] {
  if (typeof value === "string") {
    if (value.length > 40_000) throw new Error("Oversized extraction");
    value = JSON.parse(value);
  }
  if (!object(value) || !Array.isArray(value.drafts) || value.drafts.length > 5) {
    throw new Error("Invalid extraction envelope");
  }
  return value.drafts.map((raw: unknown) => {
    if (!object(raw) || (raw.kind !== "event" && raw.kind !== "group")) throw new Error("Invalid draft kind");
    const string = (key: string, max: number): string => {
      const field = raw[key];
      if (typeof field !== "string" || field.length > max) throw new Error(`Invalid ${key}`);
      return field.trim();
    };
    const strings = (key: string, count: number, length: number): string[] => {
      const field = raw[key];
      if (!Array.isArray(field) || field.length > count || field.some(s => typeof s !== "string" || s.length > length)) {
        throw new Error(`Invalid ${key}`);
      }
      return field.map(s => (s as string).trim()).filter(Boolean);
    };
    const draft: PrefillDraft = {
      kind: raw.kind,
      title: string("title", 100), description: string("description", 2000),
      location: string("location", 200), date: string("date", 10), time: string("time", 5),
      meetingDetails: string("meetingDetails", 300), tags: strings("tags", 8, 30),
      reviewNotes: strings("reviewNotes", 10, 300),
    };
    if (draft.date && !validDate(draft.date)) {
      draft.date = "";
      draft.reviewNotes.push("The date could not be validated. Please add it yourself.");
    }
    if (draft.time && !validTime(draft.time)) {
      draft.time = "";
      draft.reviewNotes.push("The time could not be validated. Please add it yourself.");
    }
    if (!draft.location) draft.reviewNotes.push("No location supplied; review before publishing.");
    if (draft.kind === "event" && !draft.date) draft.reviewNotes.push("No exact date supplied; add a date before publishing.");
    if (draft.kind === "event" && !draft.time) draft.reviewNotes.push("No exact time supplied; add a time before publishing.");
    return { ...draft, reviewNotes: [...new Set(draft.reviewNotes)] };
  });
}
