import { connection, NextResponse } from "next/server";
import {
  getExchangeRates,
  normalizeCurrency,
  SUPPORTED_CURRENCIES,
} from "@/lib/currency";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

export async function GET(request: Request) {
  try {
    await connection();

    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const rates = await getExchangeRates(context.workspace.currency);

    return NextResponse.json({
      baseCurrency: context.workspace.currency,
      rates,
      supportedCurrencies: SUPPORTED_CURRENCIES,
    });
  } catch (error) {
    console.error("Failed to load exchange rates:", error);

    return NextResponse.json(
      { error: "Failed to load exchange rates." },
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
    const currency = normalizeCurrency(body.currency, "");

    if (!currency) {
      return NextResponse.json({ error: "Currency is not supported." }, { status: 400 });
    }

    const prisma = getPrisma();
    await prisma.$transaction([
      prisma.workspace.update({
        where: { id: context.workspace.id },
        data: { currency },
      }),
      prisma.userPreference.upsert({
        where: { userId: context.user.id },
        update: { currency },
        create: {
          activeWorkspaceId: context.workspace.id,
          currency,
          onboardingComplete: true,
          userId: context.user.id,
        },
      }),
    ]);

    return NextResponse.json({ currency });
  } catch (error) {
    console.error("Failed to update currency:", error);

    return NextResponse.json(
      { error: "Failed to update currency." },
      { status: 500 },
    );
  }
}
