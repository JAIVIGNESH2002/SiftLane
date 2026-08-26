import { ZodError, z } from "zod";

export const addFeedSchema = z.object({
  url: z
    .string({
      required_error: "Feed URL is required.",
      invalid_type_error: "Feed URL must be text.",
    })
    .url("Enter a valid RSS or Atom feed URL."),
  category: z
    .string({
      invalid_type_error: "Category must be text.",
    })
    .trim()
    .max(40, "Category must be 40 characters or fewer.")
    .optional()
    .transform((value) => (value ? value : null)),
});

export const articleStateSchema = z.record(z.boolean());

export function zodErrorMessages(error: unknown) {
  if (error instanceof ZodError) {
    return error.errors.map((issue) => issue.message);
  }
  return ["Something went wrong."];
}
