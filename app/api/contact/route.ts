import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  consumeContactAttempt,
  isRepeatedContact,
  rememberContact,
} from "@/lib/contact/rate-limit";
import { contactFormSchema } from "@/lib/contact/schema";
import { verifyTurnstileToken } from "@/lib/contact/turnstile";
import type { ContactApiResponse } from "@/lib/contact/types";
import {
  MailConfigurationError,
  sendContactEmail,
} from "@/lib/email/contact-mailer";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 32 * 1024;
const unavailableMessage =
  "We could not send your message right now. Please keep it here and try again.";

function response(body: ContactApiResponse, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function getClientIdentifier(request: Request) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    forwarded ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return response(
      { ok: false, message: "Your message is too large to submit." },
      413,
    );
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return response(
        { ok: false, message: "Your message is too large to submit." },
        413,
      );
    }
    body = JSON.parse(rawBody);
  } catch {
    return response(
      { ok: false, message: "The submitted form could not be read." },
      400,
    );
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return response(
      {
        ok: false,
        message: "Please review the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  if (parsed.data.website) {
    return response(
      { ok: true, message: "Thanks. Your message has been received." },
      200,
    );
  }

  const identifier = getClientIdentifier(request);
  if (!consumeContactAttempt(identifier)) {
    return response(
      {
        ok: false,
        message: "Too many attempts. Please wait a few minutes and try again.",
      },
      429,
    );
  }

  const fingerprint = createHash("sha256")
    .update(
      `${parsed.data.email}\u0000${parsed.data.subject}\u0000${parsed.data.message}`,
    )
    .digest("hex");

  if (isRepeatedContact(identifier, fingerprint)) {
    return response(
      {
        ok: false,
        message:
          "This message was already submitted. Please wait before sending it again.",
      },
      429,
    );
  }

  if (
    !(await verifyTurnstileToken(
      (body as { turnstileToken?: unknown }).turnstileToken,
    ))
  ) {
    return response(
      {
        ok: false,
        message: "We could not verify your submission. Please try again.",
      },
      403,
    );
  }

  try {
    await sendContactEmail({
      contact: parsed.data,
      sourceUrl:
        request.headers.get("referer") || new URL("/contact", request.url).href,
      receivedAt: new Date(),
    });
    rememberContact(identifier, fingerprint);
    return response(
      {
        ok: true,
        message: "Thanks. Your message has been sent to the Orin team.",
      },
      200,
    );
  } catch (error) {
    console.error("Orin contact email delivery failed", {
      type:
        error instanceof MailConfigurationError
          ? "configuration"
          : "provider",
      code:
        error instanceof Error && "code" in error
          ? String(error.code)
          : undefined,
    });
    return response({ ok: false, message: unavailableMessage }, 503);
  }
}
