import { NextResponse } from "next/server";
import { createKycSession } from "@/lib/kyc-api";
import type { CheckSelection, GenerateLinkRequest } from "@/lib/types";

function asBool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const country = String(body.country || "NG").trim().toUpperCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ message: "Valid email is required" }, { status: 400 });
    }
    if (!phone || phone.length < 7) {
      return NextResponse.json({ message: "Valid phone is required" }, { status: 400 });
    }
    if (!/^[A-Z]{2}$/.test(country)) {
      return NextResponse.json(
        { message: "Country must be a 2-letter ISO code" },
        { status: 400 },
      );
    }

    const checksRaw = body.checks || {};
    const checks: CheckSelection = {
      phone: asBool(checksRaw.phone, true),
      email: asBool(checksRaw.email, true),
      nin: asBool(checksRaw.nin, true),
      bvn: asBool(checksRaw.bvn, true),
      bio: asBool(checksRaw.bio, true),
      liveliness: asBool(checksRaw.liveliness, true),
      document_verification: asBool(checksRaw.document_verification, false),
      disclaimer: asBool(checksRaw.disclaimer, true),
      address_verification: asBool(checksRaw.address_verification, false),
    };

    const branding = body.branding || {};
    const payload: GenerateLinkRequest = {
      email,
      phone,
      country,
      app_id: body.app_id ? String(body.app_id).trim() : undefined,
      user_ref: body.user_ref ? String(body.user_ref) : undefined,
      callback: body.callback ? String(body.callback) : undefined,
      branding: {
        brand_name: String(branding.brand_name || "Partner").trim() || "Partner",
        brand_logo: String(branding.brand_logo || "").trim(),
        bg_color: String(branding.bg_color || "#FFFFFF"),
        text_color: String(branding.text_color || "#212020"),
        button_color: String(branding.button_color || "#0F766E"),
      },
      checks,
    };

    const result = await createKycSession(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate KYC link";
    return NextResponse.json({ message }, { status: 502 });
  }
}
