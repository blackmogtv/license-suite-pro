export type ProductStatus = "active" | "inactive";

export interface Product {
  id?: string;
  client_id: string;
  name?: string;
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
  generated_by?: string | null;
  used_by?: string | null;
  used_at?: string | null;
  hwid?: string | null;
  note?: string | null;
  banned?: boolean;
  banned_reason?: string | null;
  expires_at?: string | null;
}

export interface KeyEvent {
  id?: string;
  created_at?: string;
  event_type?: string;
  actor?: string | null;
  metadata?: Record<string, unknown> | null;
}

export const KNOWN_PRODUCTS = ["BLACK_MACRO", "BLACK_TRIGGERBOT", "BLACK_SKINCHANGER"] as const;
