import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isEmailConfigured, sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Add SMTP_USER and SMTP_PASS to .env first." },
      { status: 400 },
    );
  }

  try {
    await sendEmail({
      html: `
        <p>Your Gmail SMTP setup is working.</p>
        <p>Dampener can now send email from the configured Gmail account.</p>
      `,
      subject: "Dampener email test",
      text: "Your Gmail SMTP setup is working. Dampener can now send email from the configured Gmail account.",
      to: user.email,
    });

    return NextResponse.json({ message: "Test email sent." });
  } catch (error) {
    console.error("Failed to send test email:", error);

    return NextResponse.json(
      { error: "Failed to send test email. Check your Gmail app password." },
      { status: 500 },
    );
  }
}
