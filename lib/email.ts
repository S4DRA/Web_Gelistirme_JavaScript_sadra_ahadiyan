import nodemailer from "nodemailer";

type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s/g, "");
  const from = process.env.EMAIL_FROM || user;

  if (!user || !pass || !from || pass === "paste-your-16-character-app-password-here") {
    return null;
  }

  return {
    from,
    host,
    pass,
    port,
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : port === 465,
    user,
  };
}

export function isEmailConfigured() {
  return getSmtpConfig() !== null;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  const config = getSmtpConfig();

  if (!config) {
    console.warn("Email was not sent because SMTP_USER or SMTP_PASS is missing.");
    return false;
  }

  const transporter = nodemailer.createTransport({
    auth: {
      pass: config.pass,
      user: config.user,
    },
    host: config.host,
    port: config.port,
    secure: config.secure,
  });

  await transporter.sendMail({
    from: config.from,
    html,
    subject,
    text,
    to,
  });

  return true;
}

export async function sendWelcomeEmail(to: string) {
  return sendEmail({
    html: `
      <p>Welcome to Dampener.</p>
      <p>Your account is ready, and you can start tracking your workspace finances now.</p>
    `,
    subject: "Welcome to Dampener",
    text: "Welcome to Dampener. Your account is ready, and you can start tracking your workspace finances now.",
    to,
  });
}

export async function sendSignupVerificationCode(to: string, code: string) {
  return sendEmail({
    html: `
      <p>Your Dampener verification code is:</p>
      <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${code}</p>
      <p>This code expires in 10 minutes.</p>
    `,
    subject: "Your Dampener verification code",
    text: `Your Dampener verification code is ${code}. This code expires in 10 minutes.`,
    to,
  });
}

export async function sendSignupInvitationEmail(options: {
  signupUrl: string;
  to: string;
}) {
  const signupUrl = escapeHtml(options.signupUrl);

  return sendEmail({
    html: `
      <p>Your Dampener signup request was approved.</p>
      <p><a href="${signupUrl}">Create your Dampener account</a></p>
      <p>This invitation link expires in 7 days.</p>
    `,
    subject: "Your Dampener signup request was approved",
    text: `Your Dampener signup request was approved. Create your account here: ${options.signupUrl}\n\nThis invitation link expires in 7 days.`,
    to: options.to,
  });
}

export async function sendAccessRequestToAdmin(options: {
  approvalUrl: string;
  companyName: string;
  email: string;
  fullName: string;
  message: string | null;
  role: string;
  to?: string;
  useCase: string;
}) {
  const adminEmail = options.to || process.env.ACCESS_REQUEST_ADMIN_EMAIL || process.env.SMTP_USER;
  const fields = [
    ["Requester name", options.fullName],
    ["Requester email", options.email],
    ["Company / project", options.companyName],
    ["Role", options.role],
    ["Use case", options.useCase],
    ["Optional message", options.message || "Not provided"],
    ["Approval link", options.approvalUrl],
  ];

  if (!adminEmail) {
    console.warn("Access request email was not sent because no admin email is configured.");
    return false;
  }

  return sendEmail({
    html: `
      <h2>New Dampener access request</h2>
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
      <p style="margin-top: 16px;">
        <a href="${escapeHtml(options.approvalUrl)}">Approve access request</a>
      </p>
    `,
    subject: `New Dampener access request from ${options.fullName}`,
    text: fields.map(([label, value]) => `${label}: ${value}`).join("\n"),
    to: adminEmail,
  });
}

export async function sendAccessApprovedToUser(options: {
  signupUrl: string;
  to: string;
}) {
  const signupUrl = escapeHtml(options.signupUrl);

  return sendEmail({
    html: `
      <p>You now have access to Dampener. Please create your account using this link.</p>
      <p><a href="${signupUrl}">Create your Dampener account</a></p>
    `,
    subject: "You now have access to Dampener",
    text: `You now have access to Dampener. Please create your account using this link.\n\n${options.signupUrl}`,
    to: options.to,
  });
}

export async function sendEmailChangeVerificationCode(to: string, code: string) {
  return sendEmail({
    html: `
      <p>Your Dampener email change code is:</p>
      <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${code}</p>
      <p>This code expires in 10 minutes.</p>
    `,
    subject: "Confirm your new Dampener email",
    text: `Your Dampener email change code is ${code}. This code expires in 10 minutes.`,
    to,
  });
}

export async function sendWorkspaceAccessEmail(options: {
  to: string;
  role: string;
  workspaceName: string;
}) {
  const role = escapeHtml(options.role);
  const workspaceName = escapeHtml(options.workspaceName);

  return sendEmail({
    html: `
      <p>You were added to <strong>${workspaceName}</strong> as ${role}.</p>
      <p>Sign in to Dampener to view the workspace.</p>
    `,
    subject: `You were added to ${options.workspaceName}`,
    text: `You were added to ${options.workspaceName} as ${options.role}. Sign in to Dampener to view the workspace.`,
    to: options.to,
  });
}
