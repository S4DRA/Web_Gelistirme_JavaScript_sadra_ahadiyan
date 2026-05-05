import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getActiveWorkspaceForRequest } from "@/lib/workspace";

function csvEscape(value: string | number | null) {
  const text = value === null ? "" : String(value);

  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

export async function GET(request: Request) {
  try {
    const context = await getActiveWorkspaceForRequest(request);

    if (!context) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "transactions";
    const prisma = getPrisma();

    if (type === "invoices") {
      const invoices = await prisma.invoice.findMany({
        where: { workspaceId: context.workspace.id },
        orderBy: { dueDate: "asc" },
      });
      const rows = [
        ["clientName", "amount", "dueDate", "reminderDate", "status"],
        ...invoices.map((invoice) => [
          invoice.clientName,
          invoice.amount.toString(),
          invoice.dueDate.toISOString(),
          invoice.reminderDate?.toISOString() ?? "",
          invoice.status,
        ]),
      ];

      return new Response(
        rows.map((row) => row.map(csvEscape).join(",")).join("\n"),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="dampener-invoices.csv"',
          },
        },
      );
    }

    const transactions = await prisma.transaction.findMany({
      where: { workspaceId: context.workspace.id },
      orderBy: { date: "desc" },
    });
    const rows = [
      ["type", "amount", "category", "date"],
      ...transactions.map((transaction) => [
        transaction.type,
        transaction.amount.toString(),
        transaction.category,
        transaction.date.toISOString(),
      ]),
    ];

    return new Response(rows.map((row) => row.map(csvEscape).join(",")).join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="dampener-transactions.csv"',
      },
    });
  } catch (error) {
    console.error("Failed to export data:", error);

    return NextResponse.json({ error: "Failed to export data." }, { status: 500 });
  }
}
