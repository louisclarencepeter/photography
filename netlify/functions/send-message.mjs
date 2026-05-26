// Contact form handler — sends mail via Resend.
//
// Requires env var RESEND_API_KEY (set in Netlify dashboard → Site settings →
// Environment variables). Sending domain must be verified on Resend.

const FROM = "Louis Peter Photography <hello@louisclarencepeter.com>";
const TO = "louisclarencepeters@gmail.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const name = (payload.name ?? "").toString().trim();
  const email = (payload.email ?? "").toString().trim();
  const message = (payload.message ?? "").toString().trim();
  const honeypot = (payload.botField ?? "").toString();

  // Silent drop for bots — pretend success so they don't retry.
  if (honeypot.length > 0) {
    return json({ ok: true });
  }

  if (!name || !email || !message) {
    return json({ error: "Missing required fields" }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: "Invalid email address" }, 400);
  }
  if (message.length > 5000) {
    return json({ error: "Message is too long" }, 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return json({ error: "Server is not configured" }, 500);
  }

  const subject = `New enquiry from ${name}`;
  const text = `From: ${name} <${email}>\n\n${message}`;
  const html = `
    <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
    <p style="white-space: pre-wrap; font-family: system-ui, sans-serif; line-height: 1.55;">
      ${escapeHtml(message)}
    </p>
  `.trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject,
        text,
        html
      })
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend API error:", res.status, detail);
      return json({ error: "Could not send message" }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    console.error("Send failed:", err);
    return json({ error: "Could not send message" }, 502);
  }
};

export const config = {
  path: "/api/send-message"
};
