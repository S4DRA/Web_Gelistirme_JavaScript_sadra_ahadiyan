import { connection, NextResponse } from "next/server";
import { TransactionType } from "@prisma/client";
import { convertCurrencyAmount, normalizeCurrency } from "@/lib/currency";
import {
  cleanOptionalNote,
  cleanShortText,
  isValidShortText,
  parsePositiveMoney,
} from "@/lib/financial-validation";
import { createTransactionFingerprint } from "@/lib/transaction-import";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

function formatTransaction(transaction: {
  id: string;
  type: string;
  amount: { toString(): string };
  category: string;
  date: Date;
  note: string | null;
  currency: string;
  originalAmount: { toString(): string } | null;
  originalCurrency: string | null;
  exchangeRate: { toString(): string } | null;
  userId: string;
  workspaceId: string | null;
  financeType?: string;
}) {
  return {
    id: transaction.id,
    userId: transaction.userId,
    type: transaction.type,
    amount: Number(transaction.amount.toString()),
    category: transaction.category,
    currency: transaction.currency,
    date: transaction.date.toISOString(),
    exchangeRate: transaction.exchangeRate
      ? Number(transaction.exchangeRate.toString())
      : null,
    note: transaction.note,
    originalAmount: transaction.originalAmount
      ? Number(transaction.originalAmount.toString())
      : null,
    originalCurrency: transaction.originalCurrency,
    workspaceId: transaction.workspaceId,
    financeType: transaction.financeType,
  };
}

export async function GET(request: Request) {
  try {
    await connection();

    const prisma = getPrisma();
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { financeType: context.financeType, workspaceId: context.workspace.id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions.map(formatTransaction));
  } catch (error) {
    console.error("Failed to fetch transactions:", error);

    return NextResponse.json(
      { error: "Failed to fetch transactions." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const { type, amount, category, date } = body;
    const cleanCategory = cleanShortText(category);
    const note = cleanOptionalNote(body.note);
    const originalCurrency = normalizeCurrency(body.currency, context.workspace.currency);

    if (type !== TransactionType.income && type !== TransactionType.expense) {
      return NextResponse.json(
        { error: "Type must be 'income' or 'expense'." },
        { status: 400 },
      );
    }

    const parsedAmount = parsePositiveMoney(amount);

    if (parsedAmount === null) {
      return NextResponse.json(
        { error: "Amount must be between 0.01 and 999,999,999.99." },
        { status: 400 },
      );
    }

    if (!isValidShortText(cleanCategory)) {
      return NextResponse.json(
        { error: "Category is required and must be 80 characters or fewer." },
        { status: 400 },
      );
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Date must be a valid date." },
        { status: 400 },
      );
    }

    const conversion = await convertCurrencyAmount(
      parsedAmount,
      originalCurrency,
      context.workspace.currency,
    );
    const fingerprint = createTransactionFingerprint({
      amount: conversion.amount,
      category: cleanCategory,
      date: parsedDate.toISOString().slice(0, 10),
      note,
      type,
    });
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        importFingerprint: fingerprint,
        financeType: context.financeType,
        workspaceId: context.workspace.id,
      },
      select: { id: true },
    });

    if (existingTransaction) {
      return NextResponse.json(
        { error: "A matching transaction already exists." },
        { status: 409 },
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: context.user.id,
        workspaceId: context.workspace.id,
        financeType: context.financeType,
        type,
        amount: conversion.amount,
        category: cleanCategory,
        currency: context.workspace.currency,
        date: parsedDate,
        exchangeRate: conversion.exchangeRate,
        importFingerprint: fingerprint,
        note,
        originalAmount: parsedAmount,
        originalCurrency,
      },
    });

    return NextResponse.json(formatTransaction(transaction), { status: 201 });
  } catch (error) {
    console.error("Failed to create transaction:", error);

    return NextResponse.json(
      { error: "Failed to create transaction." },
      { status: 500 },
    );
  }
}
