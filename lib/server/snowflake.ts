import "server-only";
import { createPrivateKey } from "node:crypto";
import { readFileSync } from "node:fs";
import type { RowStatement } from "snowflake-sdk";
import { EXTRACTION_SQL, extractionPrompt } from "./extraction-schema";
import { validateExtraction } from "../validation";
import type { PrefillDraft } from "../types";

export class PrefillServiceError extends Error {
  constructor(public code: "unconfigured" | "failed" | "malformed" | "timeout") { super(code); }
}

export function isSnowflakeConfigured(): boolean {
  return Boolean(process.env.SNOWFLAKE_ACCOUNT && process.env.SNOWFLAKE_USERNAME && process.env.SNOWFLAKE_WAREHOUSE && process.env.SNOWFLAKE_ROLE && (process.env.SNOWFLAKE_PRIVATE_KEY_PATH || process.env.SNOWFLAKE_PASSWORD));
}

export async function extractAnnouncement(text: string): Promise<PrefillDraft[]> {
  if (!isSnowflakeConfigured()) throw new PrefillServiceError("unconfigured");
  // Lazy loading keeps demo mode independent from SDK initialization.
  const { default: snowflake } = await import("snowflake-sdk");
  snowflake.configure({ logLevel: "OFF" });
  const keyPath = process.env.SNOWFLAKE_PRIVATE_KEY_PATH;
  let privateKey: string | undefined;
  try {
    if (keyPath) privateKey = createPrivateKey({ key: readFileSync(keyPath), format: "pem", passphrase: process.env.SNOWFLAKE_PRIVATE_KEY_PASSPHRASE }).export({ type: "pkcs8", format: "pem" }).toString();
  } catch { throw new PrefillServiceError("failed"); }
  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT!, username: process.env.SNOWFLAKE_USERNAME!,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!, role: process.env.SNOWFLAKE_ROLE!,
    authenticator: privateKey ? "SNOWFLAKE_JWT" : "SNOWFLAKE",
    ...(privateKey ? { privateKey } : { password: process.env.SNOWFLAKE_PASSWORD! }),
    timeout: 15_000,
    clientSessionKeepAlive: false,
  });

  const raw = await new Promise<unknown>((resolve, reject) => {
    let settled = false;
    let statement: RowStatement | undefined;
    const finish = (error: PrefillServiceError | null, value?: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      connection.destroy(() => {});
      if (error) reject(error); else resolve(value);
    };
    const deadline = setTimeout(() => {
      statement?.cancel(() => {});
      finish(new PrefillServiceError("timeout"));
    }, 30_000);
    try {
      connection.connect(error => {
        if (settled) { connection.destroy(() => {}); return; }
        if (error) { finish(new PrefillServiceError("failed")); return; }
        try {
          statement = connection.execute({
            sqlText: EXTRACTION_SQL,
            binds: [process.env.SNOWFLAKE_MODEL || "llama3.3-70b", extractionPrompt(text)],
            complete(error, _statement, rows) {
              if (error) finish(new PrefillServiceError("failed"));
              else finish(null, rows?.[0]?.EXTRACTION);
            },
          });
        } catch { finish(new PrefillServiceError("failed")); }
      });
    } catch { finish(new PrefillServiceError("failed")); }
  });
  try { return validateExtraction(raw); }
  catch { throw new PrefillServiceError("malformed"); }
}
