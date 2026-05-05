import { connection, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { predictFutureCashFlow } from "@/lib/predict-future-cash-flow";

export async function GET(request: Request) {
  try {
    await connection();

    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const prediction = await predictFutureCashFlow(user.id);

    return NextResponse.json(prediction);
  } catch (error) {
    console.error("Failed to load prediction data:", error);

    return NextResponse.json(
      { error: "Failed to load prediction data." },
      { status: 500 },
    );
  }
}
