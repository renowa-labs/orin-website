"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TurnstileWidget } from "@/components/contact/TurnstileWidget";
import {
  contactFormSchema,
  type ContactFormData,
  type ContactFormInput,
} from "@/lib/contact/schema";
import type { ContactApiResponse } from "@/lib/contact/types";

const turnstileSiteKey =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    : "1x00000000000000000000AA";
const turnstileErrorMessage =
  "Verification could not be completed. Please try again.";

export function ContactForm() {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput, unknown, ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      subject: "",
      message: "",
      website: "",
    },
  });

  function resetTurnstile() {
    setTurnstileToken("");
    setTurnstileKey((key) => key + 1);
  }

  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileError("");
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken("");
    setTurnstileError(turnstileErrorMessage);
  }, []);

  async function onSubmit(values: ContactFormData) {
    if (!turnstileToken) {
      setTurnstileError(
        "Please complete verification before sending your message.",
      );
      return;
    }

    try {
      const result = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, turnstileToken }),
      });
      const payload = (await result.json()) as ContactApiResponse;

      if (!result.ok || !payload.ok) {
        if (payload.fieldErrors) {
          for (const [field, messages] of Object.entries(
            payload.fieldErrors,
          )) {
            const message = messages[0];
            if (message && field in values) {
              setError(field as keyof ContactFormInput, {
                type: "server",
                message,
              });
            }
          }
        }
        resetTurnstile();
        toast.error("Message not sent", {
          description: payload.message,
        });
        return;
      }

      resetTurnstile();
      reset();
      toast.success("Message sent", {
        description: "Thanks for reaching out. The Orin team will reply soon.",
      });
    } catch {
      resetTurnstile();
      toast.error("Message not sent", {
        description:
          "We could not connect to the message service. Please keep your message here and try again.",
      });
    }
  }

  return (
    <form
      noValidate
      aria-busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
      className="contact-form"
    >
      <div className="contact-form__grid">
        <Field label="Name" error={errors.name?.message} required>
          <input
            {...register("name")}
            type="text"
            autoComplete="name"
            maxLength={100}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            placeholder="Your name"
          />
        </Field>

        <Field label="Email" error={errors.email?.message} required>
          <input
            {...register("email")}
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Organization" error={errors.company?.message}>
          <input
            {...register("company")}
            type="text"
            autoComplete="organization"
            maxLength={120}
            aria-invalid={Boolean(errors.company)}
            aria-describedby={
              errors.company ? "contact-organization-error" : undefined
            }
            placeholder="Club, school, company or team"
          />
        </Field>

        <Field label="Subject" error={errors.subject?.message} required>
          <input
            {...register("subject")}
            type="text"
            maxLength={160}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={
              errors.subject ? "contact-subject-error" : undefined
            }
            placeholder="What would you like to discuss?"
          />
        </Field>

        <Field label="Message" error={errors.message?.message} required wide>
          <textarea
            {...register("message")}
            rows={7}
            maxLength={5000}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={
              errors.message ? "contact-message-error" : undefined
            }
            placeholder="Tell us about your event, organization, partnership or question."
          />
        </Field>

        <div className="contact-form__honeypot" aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            {...register("website")}
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="contact-form__verification">
          {turnstileSiteKey ? (
            <TurnstileWidget
              siteKey={turnstileSiteKey}
              resetKey={turnstileKey}
              onToken={handleTurnstileToken}
              onError={handleTurnstileError}
            />
          ) : null}
          <p
            aria-live="polite"
            role="status"
            className={turnstileError ? "contact-form__error" : "sr-only"}
          >
            {turnstileError}
          </p>
        </div>

        <div className="contact-form__submit">
          <p>
            Your details are used only to review and respond to this enquiry.
          </p>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send message"}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  required = false,
  wide = false,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const id = `contact-${label.toLowerCase()}-error`;

  return (
    <label className={`contact-field ${wide ? "contact-field--wide" : ""}`}>
      <span>
        {label}
        {required ? (
          <b aria-hidden="true"> *</b>
        ) : (
          <em> Optional</em>
        )}
      </span>
      {children}
      {error ? (
        <small id={id} className="contact-form__error">
          {error}
        </small>
      ) : null}
    </label>
  );
}
