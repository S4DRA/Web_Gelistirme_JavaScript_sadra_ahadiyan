import { connection, NextResponse } from "next/server";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";
import { predictFutureCashFlow } from "@/lib/predict-future-cash-flow";

export async function GET(request: Request) {
  try {
    await connection();

    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const prediction = await predictFutureCashFlow(context.workspace.id);

    return NextResponse.json(prediction);
  } catch (error) {
    console.error("Failed to load prediction data:", error);

    return NextResponse.json(
      { error: "Failed to load prediction data." },
      { status: 500 },
    );
  }
}
