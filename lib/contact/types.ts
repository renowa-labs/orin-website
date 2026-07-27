export type ContactApiResponse = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};
