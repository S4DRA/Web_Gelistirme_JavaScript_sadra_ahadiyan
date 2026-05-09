import { InvoiceStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const prisma = getPrisma();
    const { id } = await context.params;
    const contextData = await getActiveWorkspaceForRequest(request);

    if (!contextData) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    const allowedStatuses = Object.values(InvoiceStatus);

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status is not valid." },
        { status: 400 },
      );
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        workspaceId: contextData.workspace.id,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Invoice not found." },
        { status: 404 },
      );
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(formatInvoice(updatedInvoice));
  } catch (error) {
    console.error("Failed to update invoice:", error);

    return NextResponse.json(
      { error: "Failed to update invoice." },
      { status: 500 },
    );
  }
}
