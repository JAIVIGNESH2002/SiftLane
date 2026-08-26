"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { feeds } from "@/db/schema";
import { fetchAndParseFeed } from "@/lib/feed";
import {
  addFeedWithItems,
  markFeedFailed,
  refreshFeedItems,
  removeFeed,
  toggleArticleState,
} from "@/lib/repository";
import { addFeedSchema, zodErrorMessages } from "@/lib/validation";
import { eq } from "drizzle-orm";

export type FormState = {
  message?: string;
  ok?: boolean;
};

export async function addFeedAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = addFeedSchema.safeParse({
    url: formData.get("url"),
    category: formData.get("category") || undefined,
  });

  if (!parsed.success) {
    return { message: zodErrorMessages(parsed.error).join(" "), ok: false };
  }

  try {
    const parsedFeed = await fetchAndParseFeed(parsed.data.url);
    await addFeedWithItems(getDb(), parsed.data, parsedFeed);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Feed validation failed.",
      ok: false,
    };
  }

  revalidatePath("/");
  return { message: "Feed added.", ok: true };
}

export async function removeFeedAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (Number.isFinite(id)) {
    await removeFeed(getDb(), id);
    revalidatePath("/");
  }
}

export async function refreshFeedAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;

  const db = getDb();
  const [feed] = await db.select().from(feeds).where(eq(feeds.id, id)).limit(1);
  if (!feed) return;

  try {
    const parsed = await fetchAndParseFeed(feed.url);
    await refreshFeedItems(db, feed, parsed);
  } catch (error) {
    await markFeedFailed(db, feed.id, error instanceof Error ? error.message : "Refresh failed.");
  }

  revalidatePath("/");
}

export async function articleStateAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const field = formData.get("field");
  const value = formData.get("value") === "true";
  if (Number.isFinite(id) && (field === "read" || field === "saved")) {
    await toggleArticleState(getDb(), id, field, value);
    revalidatePath("/");
  }
}

export async function filterAction(formData: FormData) {
  const params = new URLSearchParams();
  for (const key of ["category", "feedId", "q"]) {
    const value = formData.get(key)?.toString().trim();
    if (value) params.set(key, value);
  }
  redirect(`/${params.size ? `?${params.toString()}` : ""}`);
}
