import { ZodError, z } from "zod";

export const addFeedSchema = z.object({
  url: z
    .string()
    .url("Enter a valid RSS or Atom feed URL."),
  category: z
    .string()
    .trim()
    .max(40, "Category must be 40 characters or fewer.")
    .optional()
    .transform((value) => (value ? value : null)),
});

export const articleStateSchema = z.record(z.string(), z.boolean());

export function zodErrorMessages(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message);
  }
  return ["Something went wrong."];
}
