import { NextResponse } from "next/server";
import { predictFutureCashFlow } from "@/lib/predict-future-cash-flow";

export async function GET() {
  try {
    const prediction = await predictFutureCashFlow();

    return NextResponse.json(prediction);
  } catch (error) {
    console.error("Failed to load prediction data:", error);

    return NextResponse.json(
      { error: "Failed to load prediction data." },
      { status: 500 },
    );
  }
}
