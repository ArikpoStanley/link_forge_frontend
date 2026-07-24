import { NextResponse } from "next/server";
import { ALL_COUNTRIES } from "@/data/countries";

export async function GET() {
  return NextResponse.json({
    countries: ALL_COUNTRIES,
    total: ALL_COUNTRIES.length,
  });
}
