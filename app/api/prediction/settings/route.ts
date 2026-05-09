import { NextResponse } from "next/server";
import {
  DEFAULT_PREDICTION_OPTIONS,
  normalizePredictionOptions,
} from "@/lib/predict-future-cash-flow";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

export async function GET(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const prisma = getPrisma();
    const preference = await prisma.userPreference.findUnique({
      where: { userId: context.user.id },
      select: { predictionSettings: true },
    });

    return NextResponse.json({
      predictionSettings: normalizePredictionOptions(
        preference?.predictionSettings ?? DEFAULT_PREDICTION_OPTIONS,
      ),
    });
  } catch (error) {
    console.error("Failed to load prediction settings:", error);

    return NextResponse.json(
      { error: "Failed to load prediction settings." },
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
