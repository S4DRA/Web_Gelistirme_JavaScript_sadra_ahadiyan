import { connection, NextResponse } from "next/server";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";
import {
  normalizePredictionOptions,
  predictFutureCashFlow,
} from "@/lib/predict-future-cash-flow";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    await connection();

    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const url = new URL(request.url);
    const queryOptions = normalizePredictionOptions({
      includePlannedExpenses: url.searchParams.get("includePlannedExpenses") !== "false",
      includeRecurring: url.searchParams.get("includeRecurring") !== "false",
      includeUnpaidInvoices: url.searchParams.get("includeUnpaidInvoices") !== "false",
      mode: url.searchParams.get("mode") ?? undefined,
      periodDays: Number(url.searchParams.get("periodDays") ?? 30),
    });
    const prediction = await predictFutureCashFlow(
      context.workspace.id,
      queryOptions,
      context.financeType,
    );

    return NextResponse.json(prediction);
  } catch (error) {
    console.error("Failed to load prediction data:", error);

    return NextResponse.json(
      { error: "Failed to load prediction data." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const predictionSettings = normalizePredictionOptions(body);
    const prisma = getPrisma();
    await prisma.userPreference.update({
      where: { userId: context.user.id },
      data: { predictionSettings },
    });

    return NextResponse.json({ predictionSettings });
  } catch (error) {
    console.error("Failed to save prediction settings:", error);

    return NextResponse.json(
      { error: "Failed to save prediction settings." },
      { status: 500 },
    );
  }
}
