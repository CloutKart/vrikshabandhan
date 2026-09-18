import type { Mail } from "./types";

const API = "https://api.resend.com";

export class ResendError extends Error {
  status: number;
  retryable: boolean;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ResendError";
    this.status = status;
    this.retryable = isRetryable(status);
  }
}

/** Rate limits and provider outages may be retried; refusals (bad key, bad address, test-mode limits) may not. */
export function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

async function call(apiKey: string, path: string, body: unknown, idempotencyKey?: string, attempt = 0): Promise<unknown> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  });
  if (res.ok) return res.json();
  const text = await res.text().catch(() => "");
  let message = text;
  try {
    const parsed = JSON.parse(text) as { message?: string; name?: string };
    message = parsed.message ?? parsed.name ?? text;
  } catch {
    // plain text stays as it is
  }
  if (res.status === 429 && attempt === 0) {
    const wait = Math.min(5000, Math.max(500, Number(res.headers.get("retry-after") ?? "1") * 1000));
    await new Promise((r) => setTimeout(r, wait));
    return call(apiKey, path, body, idempotencyKey, 1);
  }
  throw new ResendError(res.status, message || `resend: HTTP ${res.status}`);
}

/** One mail. Returns the provider's id. */
export async function sendOne(apiKey: string, mail: Mail, idempotencyKey?: string): Promise<string> {
  const data = (await call(apiKey, "/emails", mail, idempotencyKey)) as { id?: string };
  return data.id ?? "";
}

/** Up to 100 mails in one request. Returns the provider's ids in the same order. */
export async function sendBatch(apiKey: string, mails: Mail[], idempotencyKey: string): Promise<string[]> {
  const data = (await call(apiKey, "/emails/batch", mails, idempotencyKey)) as { data?: Array<{ id?: string }> };
  return (data.data ?? []).map((d) => d.id ?? "");
}
