export type ProductStatus = "active" | "inactive";

export interface Product {
  id?: string;
  client_id: string;
  name?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export type KeyStatus = "USED" | "UNUSED" | "BANNED" | "EXPIRED";

export interface LicenseKey {
  license_key: string;
  client_id: string;
  status?: KeyStatus | string;
  created_at?: string | null;
  duration_days?: number | null;

  // Normalized aliases (frontend names) — populated from backend fields below.
  generated_by?: string | null; // <- backend: created_by
  used_by?: string | null;      // <- backend: user_label
  used_at?: string | null;      // <- backend: first_used_at
  last_used_at?: string | null; // <- backend: last_used_at
  last_validation_at?: string | null;

  hwid?: string | null;
  note?: string | null;
  banned?: boolean;
  banned_reason?: string | null;
  expires_at?: string | null;

  // Raw backend fields (kept for completeness)
  created_by?: string | null;
  user_label?: string | null;
  first_used_at?: string | null;
}

export interface KeyEvent {
  id?: string;
  created_at?: string;
  event_type?: string;
  actor?: string | null;
  details?: Record<string, unknown> | null;
  // legacy alias
  metadata?: Record<string, unknown> | null;
  license_key?: string;
  client_id?: string;
  hwid?: string | null;
}

export const KNOWN_PRODUCTS = ["BLACK_MACRO", "BLACK_TRIGGERBOT", "BLACK_SKINCHANGER"] as const;

/**
 * Normalize a license key payload from the backend so frontend code can rely
 * on a single set of field names regardless of which schema version the
 * edge function returns.
 */
export function normalizeLicenseKey(raw: any): LicenseKey {
  if (!raw) return raw;
  return {
    ...raw,
    generated_by: raw.generated_by ?? raw.created_by ?? null,
    used_by: raw.used_by ?? raw.user_label ?? null,
    used_at: raw.used_at ?? raw.first_used_at ?? null,
    last_used_at: raw.last_used_at ?? null,
    last_validation_at: raw.last_validation_at ?? null,
  };
}

export function normalizeKeyEvent(raw: any): KeyEvent {
  if (!raw) return raw;
  return {
    ...raw,
    details: raw.details ?? raw.metadata ?? null,
  };
}
