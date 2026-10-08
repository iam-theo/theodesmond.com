import nodemailer from "nodemailer"

const SITE_URL = process.env.SITE_URL || "https://theodesmond.com"

function transport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  })
}

export function mailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)
}

export async function sendMail({ to, subject, text, html }) {
  if (!mailConfigured()) return { ok: false, error: "SMTP not configured" }
  try {
    const info = await transport().sendMail({
      from: process.env.NOTIFY_FROM_EMAIL || "no-reply@theodesmond.com",
      to,
      subject,
      text,
      html,
    })
    return { ok: true, messageId: info.messageId }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Shared branded layout for every notification mail.
 * Table-based + inline styles for Gmail / Outlook / Apple Mail.
 */
export function emailShell({ eyebrow, title, intro = "", body, cta = null, footerNote = "" }) {
  const introHtml = intro
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#a1a1aa;">${intro}</p>`
    : ""
  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 4px;"><tr><td style="border-radius:8px;background:#09090b;"><a href="${esc(cta.href)}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${esc(cta.label)} &rarr;</a></td></tr></table>`
    : ""
  const footerHtml = footerNote
    ? `<p style="margin:16px 0 0;font-size:11px;line-height:1.6;color:#a1a1aa;">${footerNote}</p>`
    : ""

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(title)} — Theo Desmond</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f4f5;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">
<tr><td style="border-radius:12px 12px 0 0;background:#09090b;padding:24px 28px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td width="44" style="vertical-align:middle;"><span style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;border-radius:8px;background:#ffffff;color:#09090b;font-family:monospace;font-size:13px;font-weight:700;">TD</span></td>
<td style="vertical-align:middle;padding-left:12px;"><span style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;">Theo Desmond</span><br/><span style="font-family:monospace;font-size:10px;letter-spacing:2px;color:#a1a1aa;">THEODESMOND.COM</span></td>
</tr></table>
</td></tr>
<tr><td style="background:#09090b;padding:0 28px 24px;">
<p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:2px;color:#a1a1aa;">${esc(eyebrow)}</p>
<h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:24px;line-height:1.3;color:#ffffff;">${esc(title)}</h1>
${introHtml}
</td></tr>
<tr><td style="border:1px solid #e4e4e7;border-top:0;border-radius:0 0 12px 12px;background:#ffffff;padding:24px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#3f3f46;">
${body}
${ctaHtml}
</td></tr>
<tr><td style="padding:16px 8px 0;text-align:center;">
<p style="margin:0;font-size:11px;color:#a1a1aa;">Sent from <a href="${SITE_URL}" style="color:#52525b;">theodesmond.com</a></p>
${footerHtml}
</td></tr>
</table>
</td></tr>
</table>
</div>
</body>
</html>`
}

/** Label/value detail rows for owner notifications. Values must be pre-escaped (or safe HTML). */
export function detailRows(pairs) {
  const rows = pairs
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px 8px 0;font-size:11px;letter-spacing:1px;color:#a1a1aa;white-space:nowrap;vertical-align:top;">${esc(label).toUpperCase()}</td><td style="padding:8px 0;font-size:14px;color:#18181b;word-break:break-word;">${value}</td></tr>`
    )
    .join("")
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">${rows}</table>`
}

/** Indented quote block. Text must be pre-escaped. */
export function quoteBlock(html) {
  return `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #09090b;background:#fafafa;color:#3f3f46;">${html}</blockquote>`
}

export { SITE_URL }
