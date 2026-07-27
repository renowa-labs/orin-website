import "server-only";
import nodemailer from "nodemailer";
import { z } from "zod";
import type { ContactFormData } from "@/lib/contact/schema";

const mailEnvironmentSchema = z.object({
  BREVO_SMTP_HOST: z.string().trim().min(1).default("smtp-relay.brevo.com"),
  BREVO_SMTP_PORT: z.coerce
    .number()
    .int()
    .refine((value) => value === 465 || value === 587, {
      message: "BREVO_SMTP_PORT must be 465 or 587.",
    })
    .default(587),
  BREVO_SMTP_USER: z.string().trim().min(1),
  BREVO_SMTP_PASSWORD: z.string().min(1),
  CONTACT_FROM_EMAIL: z.string().trim().email(),
  CONTACT_FROM_NAME: z.string().trim().min(1).default("Orin Website"),
  CONTACT_TO_EMAIL: z
    .string()
    .trim()
    .email()
    .default("info@renowa-labs.com"),
});

type MailEnvironment = z.infer<typeof mailEnvironmentSchema>;

export class MailConfigurationError extends Error {
  constructor() {
    super("Contact mail delivery is not configured.");
    this.name = "MailConfigurationError";
  }
}

let cachedEnvironment: MailEnvironment | undefined;
let cachedTransporter:
  | ReturnType<typeof nodemailer.createTransport>
  | undefined;

function getMailEnvironment() {
  if (cachedEnvironment) return cachedEnvironment;

  const parsed = mailEnvironmentSchema.safeParse(process.env);
  if (!parsed.success) throw new MailConfigurationError();

  cachedEnvironment = parsed.data;
  return cachedEnvironment;
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const environment = getMailEnvironment();

  cachedTransporter = nodemailer.createTransport({
    host: environment.BREVO_SMTP_HOST,
    port: environment.BREVO_SMTP_PORT,
    secure: environment.BREVO_SMTP_PORT === 465,
    auth: {
      user: environment.BREVO_SMTP_USER,
      pass: environment.BREVO_SMTP_PASSWORD,
    },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 12_000,
    tls: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
    },
  });

  return cachedTransporter;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

function withLineBreaks(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

export async function sendContactEmail({
  contact,
  sourceUrl,
  receivedAt,
}: {
  contact: ContactFormData;
  sourceUrl: string;
  receivedAt: Date;
}) {
  const environment = getMailEnvironment();
  const transporter = getTransporter();
  const company = contact.company || "Not provided";
  const timestamp = receivedAt.toISOString();
  const text = [
    "New enquiry from the Orin website",
    "Orin is a Renowa Labs product.",
    "",
    `Name: ${contact.name}`,
    `Email: ${contact.email}`,
    `Organization: ${company}`,
    `Subject: ${contact.subject}`,
    "",
    contact.message,
    "",
    `Source: ${sourceUrl}`,
    `Received: ${timestamp}`,
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;color:#171717;line-height:1.6">
      <h1 style="font-size:20px">New Orin website enquiry</h1>
      <p style="color:#666666">Orin is a Renowa Labs product.</p>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
        <tr><th align="left">Name</th><td>${escapeHtml(contact.name)}</td></tr>
        <tr><th align="left">Email</th><td>${escapeHtml(contact.email)}</td></tr>
        <tr><th align="left">Organization</th><td>${escapeHtml(company)}</td></tr>
        <tr><th align="left">Subject</th><td>${escapeHtml(contact.subject)}</td></tr>
      </table>
      <h2 style="font-size:16px">Message</h2>
      <p>${withLineBreaks(contact.message)}</p>
      <hr style="border:0;border-top:1px solid #dddddd" />
      <p style="font-size:12px;color:#666666">Source: ${escapeHtml(sourceUrl)}<br />Received: ${timestamp}</p>
    </div>`;

  const result = await Promise.race([
    transporter.sendMail({
      from: {
        name: environment.CONTACT_FROM_NAME,
        address: environment.CONTACT_FROM_EMAIL,
      },
      to: environment.CONTACT_TO_EMAIL,
      replyTo: { name: contact.name, address: contact.email },
      subject: `[Orin Contact] ${contact.subject}`,
      text,
      html,
    }),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Contact mail delivery timed out.")),
        15_000,
      );
    }),
  ]);

  if (!result.accepted.length || result.rejected.length) {
    throw new Error("Contact mail delivery was rejected.");
  }
}
