import { NextResponse } from "next/server";
import { fetchVerificationStatus } from "@/lib/kyc-api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: "verification id required" }, { status: 400 });
    }
    const status = await fetchVerificationStatus(id);
    return NextResponse.json(status);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch status";
    return NextResponse.json({ message }, { status: 502 });
  }
}
