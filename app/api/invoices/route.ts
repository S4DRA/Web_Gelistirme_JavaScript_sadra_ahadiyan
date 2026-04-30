import { InvoiceStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

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

export async function GET() {
  try {
    const user = await getDemoUser();

    const invoices = await prisma.invoice.findMany({
      where: { userId: user.id },
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
    const body = await request.json();
    const { clientName, amount, dueDate, status } = body;

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

    if (status !== InvoiceStatus.paid && status !== InvoiceStatus.unpaid) {
      return NextResponse.json(
        { error: "Status must be 'paid' or 'unpaid'." },
        { status: 400 },
      );
    }

    const user = await getDemoUser();

    const invoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        clientName: clientName.trim(),
        amount: parsedAmount,
        dueDate: parsedDueDate,
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
