import { createClient } from "@supabase/supabase-js";

// Connected to existing Supabase project (abhomngvbwukliyqgxhh).
// IMPORTANT: paste your project's anon/publishable key below.
// Find it at: Supabase Dashboard -> Project Settings -> API -> "anon public" key.
// This is a public key and safe to commit.
export const SUPABASE_URL = "https://abhomngvbwukliyqgxhh.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_hknmdY3DLK5is-1QH7TX1Q_fc7M-Z2c";

export const MANAGE_KEYS_URL = `${SUPABASE_URL}/functions/v1/manage-keys`;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type ManageKeysAction =
  | "list_products"
  | "create_product"
  | "list_keys"
  | "get_key"
  | "create_keys"
  | "ban_key"
  | "unban_key"
  | "reset_hwid"
  | "update_note"
  | "set_duration"
  | "delete_key";

export async function callManageKeys<T = any>(
  action: ManageKeysAction,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(MANAGE_KEYS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error || body?.message || `Request failed (${res.status})`) as Error & {
      status?: number;
      body?: unknown;
    };
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body as T;
}
