import { z } from "zod";

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(100, "Name must be 100 characters or fewer."),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .max(254, "Email must be 254 characters or fewer.")
    .transform((value) => value.toLowerCase()),
  company: z
    .string()
    .trim()
    .max(120, "Organization must be 120 characters or fewer.")
    .optional()
    .default(""),
  subject: z
    .string()
    .trim()
    .min(3, "Please add a subject.")
    .max(160, "Subject must be 160 characters or fewer."),
  message: z
    .string()
    .trim()
    .min(20, "Please share at least 20 characters so we can understand your request.")
    .max(5000, "Message must be 5,000 characters or fewer."),
  website: z.string().trim().max(200).optional().default(""),
});

export type ContactFormInput = z.input<typeof contactFormSchema>;
export type ContactFormData = z.output<typeof contactFormSchema>;
