import dns from "node:dns";
import type { CheckSelection, GenerateLinkRequest } from "./types";

// Prefer IPv4 — Fly hosts advertise AAAA; some networks fail undici on IPv6 ("fetch failed")
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Node < 17
}

function extractErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback;
  const record = body as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }
  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }
  const errors = record.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0] as Record<string, unknown>;
    const msg = first?.msg || first?.message;
    if (typeof msg === "string" && msg.trim()) {
      const path =
        typeof first.path === "string" && first.path.trim()
          ? first.path.trim()
          : "";
      return path ? `${path}: ${msg}` : msg;
    }
  }
  if (errors && typeof errors === "object") {
    const values = Object.values(errors as Record<string, unknown>);
    const first = values[0];
    if (typeof first === "string" && first.trim()) return first;
  }
  return fallback;
}

/** Prod Joi requires brand_logo to be a real URI or empty — drop invalid values. */
export function sanitizeBrandLogo(logo: string) {
  const trimmed = logo.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return trimmed;
  } catch {
    return "";
  }
}

/** Accept only http(s) redirect/callback URLs; return empty string if invalid. */
export function sanitizeHttpUrl(value: string | undefined | null) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return trimmed;
  } catch {
    return "";
  }
}

export function buildIndividualChecks(
  checks: CheckSelection,
  country?: string,
) {
  const code = String(country || "NG").trim().toUpperCase();
  const isNigeria = code === "NG";
  const isGhana = code === "GH";
  // Only what the tenant turned on — modular KYC is selection-driven.
  const verification_types: Record<string, boolean> = {};
  if (checks.phone) verification_types.phone = true;
  if (checks.email) verification_types.email = true;
  if (isNigeria && checks.nin) verification_types.nin = true;
  if (isNigeria && checks.bvn) verification_types.bvn = true;

  return {
    ...(checks.bio ? { bio: true } : {}),
    ...(checks.document_verification ? { document_verification: true } : {}),
    ...(checks.disclaimer ? { disclaimer: true } : {}),
    ...(checks.liveliness ? { liveliness: true } : {}),
    ...(checks.address_verification
      ? { address_verification: { enabled: true, upload_proof_of_address: true } }
      : {}),
    ...((isGhana || isNigeria) && checks.quick_address_verification
      ? { quick_address_verification: true }
      : {}),
    ...(Object.keys(verification_types).length
      ? { verification_types }
      : {}),
  };
}

export function getApiConfig() {
  const apiBase = (process.env.KYC_API_BASE_URL || "").replace(/\/$/, "");
  const appId = (process.env.KYC_APP_ID || "").trim();
  const frontendUrl = (
    process.env.KYC_FRONTEND_URL || "https://transid2.fuspay.finance"
  ).replace(/\/$/, "");
  // Inline iframe host — defaults to the same hosted Modular UI
  const inlineFrontendUrl = (
    process.env.KYC_INLINE_FRONTEND_URL || frontendUrl
  ).replace(/\/$/, "");
  const defaultCallback =
    process.env.KYC_DEFAULT_CALLBACK_URL || "https://webhook.site/test-callback";

  return { apiBase, appId, frontendUrl, inlineFrontendUrl, defaultCallback };
}

function networkErrorMessage(apiBase: string, err: unknown) {
  const error = err instanceof Error ? err : new Error(String(err));
  const cause = error.cause;
  let detail = error.message;
  if (cause instanceof Error && cause.message) {
    detail = `${detail}: ${cause.message}`;
  } else if (cause && typeof cause === "object" && "code" in cause) {
    detail = `${detail}: ${String((cause as { code?: string }).code)}`;
  }
  return `Cannot reach KYC API at ${apiBase} (${detail}). Check KYC_API_BASE_URL / network.`;
}

async function postJson(url: string, body: unknown) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Split "Ada Augusta Lovelace" → first / middle / last for Modular user + bio prefill. */
export function splitFullName(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { first_name: "", middle_name: "", last_name: "" };
  }
  if (parts.length === 1) {
    return { first_name: parts[0], middle_name: "", last_name: "" };
  }
  if (parts.length === 2) {
    return { first_name: parts[0], middle_name: "", last_name: parts[1] };
  }
  return {
    first_name: parts[0],
    middle_name: parts.slice(1, -1).join(" "),
    last_name: parts[parts.length - 1],
  };
}

export async function createKycSession(input: GenerateLinkRequest) {
  const { apiBase, appId: envAppId, frontendUrl, defaultCallback } = getApiConfig();
  const appId = (input.app_id || envAppId || "").trim();

  if (!apiBase) {
    throw new Error("KYC_API_BASE_URL is not configured");
  }
  if (!appId) {
    throw new Error(
      "KYC_APP_ID is not configured. Set a production Apps ObjectId in .env.local or the form.",
    );
  }
  if (!/^[a-fA-F0-9]{24}$/.test(appId)) {
    throw new Error(
      "KYC_APP_ID must be a 24-character Mongo ObjectId from the production apps collection.",
    );
  }

  const userRef =
    (input.user_ref || "").trim() ||
    `portal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const branding = {
    brand_name: input.branding.brand_name.trim(),
    brand_logo: sanitizeBrandLogo(input.branding.brand_logo),
    bg_color: input.branding.bg_color,
    text_color: input.branding.text_color,
    button_color: input.branding.button_color,
  };

  const nameParts = splitFullName(input.full_name || "");
  const hasName =
    Boolean(nameParts.first_name) ||
    Boolean(nameParts.last_name) ||
    Boolean(nameParts.middle_name);

  const baseUserPayload: Record<string, unknown> = {
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    user_ref: userRef,
    app: appId,
    country: input.country,
    branding,
  };

  const namedUserPayload = hasName
    ? {
        ...baseUserPayload,
        ...(nameParts.first_name ? { first_name: nameParts.first_name } : {}),
        ...(nameParts.last_name ? { last_name: nameParts.last_name } : {}),
        ...(nameParts.middle_name
          ? { middle_name: nameParts.middle_name }
          : {}),
      }
    : baseUserPayload;

  let userRes = await postJson(`${apiBase}/user`, namedUserPayload).catch(
    (err) => {
      throw new Error(networkErrorMessage(apiBase, err));
    },
  );

  let userBody = await userRes.json().catch(() => ({}));
  let namePrefillSaved = hasName;
  let namePrefillWarning: string | undefined;

  // Older prod builds reject name fields — retry without so link generation still works
  if (
    !userRes.ok &&
    hasName &&
    /first_name|last_name|middle_name|not allowed/i.test(
      extractErrorMessage(userBody, ""),
    )
  ) {
    namePrefillSaved = false;
    namePrefillWarning =
      "Full name was not saved — production KYC_Verif does not accept name fields yet. Deploy KYC_Verif, then generate a new link with Full name filled.";
    userRes = await postJson(`${apiBase}/user`, baseUserPayload).catch((err) => {
      throw new Error(networkErrorMessage(apiBase, err));
    });
    userBody = await userRes.json().catch(() => ({}));
  }

  if (!userRes.ok) {
    throw new Error(extractErrorMessage(userBody, `Failed to create user (${userRes.status})`));
  }

  const customerId = userBody.customer_id;
  if (!customerId) {
    throw new Error("Backend did not return customer_id");
  }

  const verificationRes = await postJson(`${apiBase}/verification`, {
    customer_id: customerId,
    country: input.country,
    callback: (input.callback || defaultCallback).trim(),
    redirect: sanitizeHttpUrl(input.redirect) || `${frontendUrl}/success`,
    individual_checks: buildIndividualChecks(input.checks, input.country),
    branding,
  }).catch((err) => {
    throw new Error(networkErrorMessage(apiBase, err));
  });

  const verificationBody = await verificationRes.json().catch(() => ({}));
  if (!verificationRes.ok) {
    throw new Error(
      extractErrorMessage(
        verificationBody,
        `Failed to create verification (${verificationRes.status})`,
      ),
    );
  }

  return {
    customer_id: customerId,
    verification_id: verificationBody.verification_id,
    verification_url: verificationBody.verification_url,
    reference: verificationBody.reference || "",
    todo: verificationBody.todo || [],
    total_checks: verificationBody.total_checks || 0,
    name_prefill: namePrefillSaved,
    name_prefill_warning: namePrefillWarning,
  };
}

export async function fetchVerificationStatus(verificationId: string) {
  const { apiBase } = getApiConfig();
  if (!apiBase) {
    throw new Error("KYC_API_BASE_URL is not configured");
  }

  const res = await fetch(`${apiBase}/status/${verificationId}`, {
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      body?.message || body?.error || `Status fetch failed (${res.status})`,
    );
  }
  return body;
}
