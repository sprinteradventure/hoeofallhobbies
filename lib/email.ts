import { SITE_NAME, SITE_URL } from '@/lib/site'

// ============================================================================
// Transactional email via Resend's HTTPS API (https://resend.com/docs).
// Deliberately uses plain fetch instead of the `resend` npm package so this
// feature adds zero new dependencies.
//
// Required env vars (server-side only):
//   RESEND_API_KEY  — API key from the Resend dashboard. When unset, every
//                     send is skipped with a warning and messaging keeps
//                     working (email is best-effort by design).
//   RESEND_FROM     — verified sender, e.g.
//                     "Hoe of All Hobbies <notifications@hoeofallhobbies.com>".
//                     Falls back to Resend's shared testing sender, which only
//                     delivers to the Resend account owner's own address.
// ============================================================================

const FROM_ADDRESS =
  process.env.RESEND_FROM || `${SITE_NAME} <onboarding@resend.dev>`

interface NewMessageEmailParams {
  to: string
  recipientName: string
  senderName: string
  listingTitle: string
  snippet: string
  threadUrl: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHtml({
  recipientName,
  senderName,
  listingTitle,
  snippet,
  threadUrl,
}: Omit<NewMessageEmailParams, 'to'>): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#faf8f5;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="background-color:#ffffff;border:1px solid #ead6ce;border-radius:16px;padding:32px;">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#c9a876;font-weight:bold;">
          ${escapeHtml(SITE_NAME)}
        </p>
        <h1 style="margin:0 0 16px;font-size:24px;color:#3d4451;font-weight:bold;">
          New message from ${escapeHtml(senderName)}
        </h1>
        <p style="margin:0 0 16px;font-size:14px;color:#9b8a7e;">
          Hi ${escapeHtml(recipientName)}, you have a new message about your listing
          <strong style="color:#3d4451;">${escapeHtml(listingTitle)}</strong>:
        </p>
        <div style="background-color:#f5f1ed;border-left:3px solid #c9a876;border-radius:8px;padding:16px;margin:0 0 24px;">
          <p style="margin:0;font-size:14px;color:#3d4451;font-style:italic;">
            &ldquo;${escapeHtml(snippet)}&rdquo;
          </p>
        </div>
        <a href="${escapeHtml(threadUrl)}"
           style="display:inline-block;background-color:#3d4451;color:#faf8f5;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:12px;">
          View conversation
        </a>
      </div>
      <p style="margin:16px 0 0;font-size:12px;color:#9b8a7e;text-align:center;">
        You received this email because someone messaged you on ${escapeHtml(SITE_NAME)}.
      </p>
    </div>
  </body>
</html>`
}

/**
 * Send a "new message" notification. Returns true when the email was accepted
 * by Resend. Never throws — callers should treat email as fire-and-forget.
 */
export async function sendNewMessageEmail(params: NewMessageEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping new-message notification')
    return false
  }
  if (!params.to) {
    console.warn('[email] recipient has no email address — skipping notification')
    return false
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: params.to,
        subject: `New message from ${params.senderName} about ${params.listingTitle}`,
        html: buildHtml(params),
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[email] Resend rejected new-message email (${res.status}): ${detail}`)
      return false
    }
    return true
  } catch (error) {
    console.error('[email] Failed to send new-message email:', error)
    return false
  }
}

export function buildThreadUrl(conversationId: string): string {
  return `${SITE_URL}/messages/${conversationId}`
}
