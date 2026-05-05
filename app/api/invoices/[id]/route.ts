import { InvoiceStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function formatInvoice(invoice: {
  id: string;
  userId: string;
  clientName: string;
  amount: { toString(): string };
  dueDate: Date;
  status: string;
}) {
  return {
    id: invoice.id,
    userId: invoice.userId,
    clientName: invoice.clientName,
    amount: Number(invoice.amount.toString()),
    dueDate: invoice.dueDate.toISOString(),
    status: invoice.status,
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const prisma = getPrisma();
    const { id } = await context.params;
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (status !== InvoiceStatus.paid && status !== InvoiceStatus.unpaid) {
      return NextResponse.json(
        { error: "Status must be 'paid' or 'unpaid'." },
        { status: 400 },
      );
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id,
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
