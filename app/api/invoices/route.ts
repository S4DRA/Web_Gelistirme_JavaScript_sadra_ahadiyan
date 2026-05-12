import { InvoiceStatus } from "@prisma/client";
import { connection, NextResponse } from "next/server";
import { convertCurrencyAmount, normalizeCurrency } from "@/lib/currency";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

function formatInvoice(invoice: {
  id: string;
  userId: string;
  workspaceId: string | null;
  clientName: string;
  amount: { toString(): string };
  currency: string;
  dueDate: Date;
  exchangeRate: { toString(): string } | null;
  reminderDate: Date | null;
  status: string;
  originalAmount: { toString(): string } | null;
  originalCurrency: string | null;
  financeType?: string;
}) {
  return {
    id: invoice.id,
    userId: invoice.userId,
    workspaceId: invoice.workspaceId,
    clientName: invoice.clientName,
    amount: Number(invoice.amount.toString()),
    currency: invoice.currency,
    dueDate: invoice.dueDate.toISOString(),
    exchangeRate: invoice.exchangeRate ? Number(invoice.exchangeRate.toString()) : null,
    reminderDate: invoice.reminderDate?.toISOString() ?? null,
    status: invoice.status,
    originalAmount: invoice.originalAmount
      ? Number(invoice.originalAmount.toString())
      : null,
    originalCurrency: invoice.originalCurrency,
    financeType: invoice.financeType,
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

    const invoices = await prisma.invoice.findMany({
      where: { financeType: context.financeType, workspaceId: context.workspace.id },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(invoices.map(formatInvoice));
  } catch (error) {
    console.error("Failed to fetch invoices:", error);

    return NextResponse.json(
      { error: "Failed to fetch invoices." },
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
    const { clientName, amount, dueDate, reminderDate, status } = body;
    const originalCurrency = normalizeCurrency(body.currency, context.workspace.currency);

    if (typeof clientName !== "string" || clientName.trim().length === 0) {
      return NextResponse.json(
        { error: "Client name is required." },
        { status: 400 },
      );
    }

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a number greater than 0." },
        { status: 400 },
      );
    }

    const parsedDueDate = new Date(dueDate);

    if (Number.isNaN(parsedDueDate.getTime())) {
      return NextResponse.json(
        { error: "Due date must be a valid date." },
        { status: 400 },
      );
    }

    const allowedStatuses = Object.values(InvoiceStatus);

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status is not valid." },
        { status: 400 },
      );
    }

    const parsedReminderDate = reminderDate ? new Date(reminderDate) : null;

    if (parsedReminderDate && Number.isNaN(parsedReminderDate.getTime())) {
      return NextResponse.json(
        { error: "Reminder date must be a valid date." },
        { status: 400 },
      );
    }

    const conversion = await convertCurrencyAmount(
      parsedAmount,
      originalCurrency,
      context.workspace.currency,
    );

    const invoice = await prisma.invoice.create({
      data: {
        userId: context.user.id,
        workspaceId: context.workspace.id,
        financeType: context.financeType,
        clientName: clientName.trim(),
        amount: conversion.amount,
        currency: context.workspace.currency,
        dueDate: parsedDueDate,
        exchangeRate: conversion.exchangeRate,
        originalAmount: parsedAmount,
        originalCurrency,
        reminderDate: parsedReminderDate,
        status,
      },
    });

    return NextResponse.json(formatInvoice(invoice), { status: 201 });
  } catch (error) {
    console.error("Failed to create invoice:", error);

    return NextResponse.json(
      { error: "Failed to create invoice." },
      { status: 500 },
    );
  }
}
