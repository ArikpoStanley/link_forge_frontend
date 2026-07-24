import { NextResponse } from "next/server";
import { getApiConfig } from "@/lib/kyc-api";

export async function GET() {
  const { apiBase, appId, frontendUrl, inlineFrontendUrl } = getApiConfig();
  return NextResponse.json({
    api_base: apiBase,
    app_id: appId,
    frontend_url: frontendUrl,
    inline_frontend_url: inlineFrontendUrl,
  });
}
