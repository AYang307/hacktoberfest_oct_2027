import { NextResponse } from "next/server";
import { extractAnnouncement, isSnowflakeConfigured, PrefillServiceError } from "@/lib/server/snowflake";
import { SAMPLE_ANNOUNCEMENT, SAMPLE_DRAFTS } from "@/lib/sample";
import { MAX_ANNOUNCEMENT } from "@/lib/validation";
import type { PrefillResult } from "@/lib/types";

export const runtime = "nodejs";

// Read incrementally so an absent or dishonest Content-Length cannot bypass the limit.
async function readLimitedBody(request: Request): Promise<string> {
  const limit = 40_000; // Enough for 8,000 UTF-16 characters plus JSON escaping.
  if (Number(request.headers.get("content-length")) > limit) throw new Error("too-large");
  if (!request.body) throw new Error("invalid-json");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("too-large"); }
      body += decoder.decode(value, { stream: true });
    }
    return body + decoder.decode();
  } finally { reader.releaseLock(); }
}

const jsonError = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return jsonError("Send the announcement as JSON.", 415);
  let body: unknown;
  try { body = JSON.parse(await readLimitedBody(request)); }
  catch (error) { return error instanceof Error && error.message === "too-large" ? jsonError("That announcement is too large.", 413) : jsonError("Invalid JSON. Please try again.", 400); }
  if (!body || typeof body !== "object" || !("text" in body) || typeof body.text !== "string" || !body.text.trim()) return jsonError("Paste an announcement first.", 400);
  if (body.text.length > MAX_ANNOUNCEMENT) return jsonError(`Keep announcements under ${MAX_ANNOUNCEMENT.toLocaleString()} characters.`, 413);
  const text = body.text.trim();
  if (!isSnowflakeConfigured()) {
    if (text !== SAMPLE_ANNOUNCEMENT.trim()) return jsonError("Snowflake isn’t configured. Use “Load sample announcement” for a clearly labeled sample demo, or enter your details manually. Arbitrary text requires server-side Snowflake credentials.", 503);
    return NextResponse.json({ source: "sample", message: "Two prewritten sample drafts, not an AI result. Select one, review it, and publish it yourself.", drafts: SAMPLE_DRAFTS } satisfies PrefillResult);
  }
  try {
    const drafts = await extractAnnouncement(text);
    return NextResponse.json({ source: "snowflake", message: "Extracted with Snowflake Cortex. Check every field; unknown details are left blank. Select a draft to review and publish.", drafts } satisfies PrefillResult);
  } catch (error) {
    // Never return or log driver errors, SQL, credentials, or announcement text.
    if (error instanceof PrefillServiceError && error.code === "timeout") return jsonError("Snowflake took too long. Try again or use manual entry.", 504);
    if (error instanceof PrefillServiceError && error.code === "malformed") return jsonError("Snowflake returned an unreadable draft. Nothing was published. Try again or use manual entry.", 502);
    return jsonError("Snowflake prefill is unavailable. Check server credentials, warehouse, role permissions, and model access, or use manual entry.", 502);
  }
}
