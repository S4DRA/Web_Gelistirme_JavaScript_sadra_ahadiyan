import { NextResponse } from "next/server";
import { isEmailConfigured, sendEmail } from "@/lib/email";

const leadRecipient = "sadraahadiyan@gmail.com";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = clean(body.fullName);
    const country = clean(body.country);
    const phoneNumber = clean(body.phoneNumber);
    const companyName = clean(body.companyName);
    const companyWebsite = clean(body.companyWebsite);
    const note = clean(body.note);
    const source = clean(body.source) || "Landing page";

    if (!fullName || !country || !phoneNumber) {
      return NextResponse.json(
        { error: "Name, country, and phone number are required." },
        { status: 400 },
      );
    }

    if (companyName && !companyWebsite) {
      return NextResponse.json(
        { error: "Company website is required when a company name is provided." },
        { status: 400 },
      );
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Email is not configured. Add SMTP_USER and SMTP_PASS to .env." },
        { status: 500 },
      );
    }

    const fields = [
      ["Source", source],
      ["Name and surname", fullName],
      ["Country", country],
      ["Phone number", phoneNumber],
      ["Company name", companyName || "Not provided"],
      ["Company website", companyWebsite || "Not provided"],
      ["Note", note || "Not provided"],
    ];

    await sendEmail({
      html: `
        <h2>New Dampener lead</h2>
        <table cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
          ${fields
            .map(
              ([label, value]) => `
                <tr>
                  <td style="border: 1px solid #d1d5db; font-weight: 700;">${escapeHtml(label)}</td>
                  <td style="border: 1px solid #d1d5db;">${escapeHtml(value)}</td>
                </tr>
              `,
            )
            .join("")}
        </table>
      `,
      subject: `New Dampener ${source} request`,
      text: fields.map(([label, value]) => `${label}: ${value}`).join("\n"),
      to: leadRecipient,
    });

    return NextResponse.json({ message: "Request sent." });
  } catch (error) {
    console.error("Failed to send lead email:", error);

    return NextResponse.json(
      { error: "Failed to send request. Please try again." },
      { status: 500 },
    );
  }
}
