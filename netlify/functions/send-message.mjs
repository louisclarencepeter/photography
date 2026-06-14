// Contact form handler — sends mail via Resend.
//
// Requires env var RESEND_API_KEY (set in Netlify dashboard → Site settings →
// Environment variables). Sending domain must be verified on Resend.

const FROM = "Louis Peter Photography <hello@louisclarencepeter.com>";
const TO = "louisclarencepeters@gmail.com";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 5000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const IP_RATE_LIMIT = 12;
const EMAIL_RATE_LIMIT = 4;
const rateLimitBuckets = new Map();

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json",
      ...headers
    }
  });
}

function getClientIp(req) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return (
    req.headers.get("x-nf-client-connection-ip") ??
    req.headers.get("client-ip") ??
    "unknown"
  );
}

function isRateLimited(key, limit, now = Date.now()) {
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const bucket = (rateLimitBuckets.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
  bucket.push(now);
  rateLimitBuckets.set(key, bucket);

  if (rateLimitBuckets.size > 5000) {
    for (const [bucketKey, timestamps] of rateLimitBuckets) {
      const fresh = timestamps.filter((timestamp) => timestamp > cutoff);
      if (fresh.length === 0) {
        rateLimitBuckets.delete(bucketKey);
      } else {
        rateLimitBuckets.set(bucketKey, fresh);
      }
    }
  }

  return bucket.length > limit;
}

async function verifyTurnstile(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const body = new URLSearchParams({
    secret,
    response: token
  });

  if (remoteIp !== "unknown") {
    body.set("remoteip", remoteIp);
  }

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body
    });

    if (!res.ok) {
      console.error("Turnstile verification failed:", res.status);
      return false;
    }

    const result = await res.json();
    return result.success === true;
  } catch (err) {
    console.error("Turnstile request failed:", err);
    return false;
  }
}

export default async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, { allow: "POST" });
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
  const turnstileToken = (payload.turnstileToken ?? "").toString();
  const clientIp = getClientIp(req);

  // Silent drop for bots — pretend success so they don't retry.
  if (honeypot.length > 0) {
    return json({ ok: true });
  }

  if (isRateLimited(`ip:${clientIp}`, IP_RATE_LIMIT)) {
    return json(
      { error: "Too many messages. Please try again in a few minutes." },
      429,
      { "retry-after": String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)) }
    );
  }

  if (!name || !email || !message) {
    return json({ error: "Missing required fields" }, 400);
  }
  if (name.length > MAX_NAME_LENGTH) {
    return json({ error: "Name is too long" }, 400);
  }
  if (email.length > MAX_EMAIL_LENGTH) {
    return json({ error: "Email address is too long" }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: "Invalid email address" }, 400);
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return json({ error: "Message is too long" }, 400);
  }
  if (isRateLimited(`email:${email.toLowerCase()}`, EMAIL_RATE_LIMIT)) {
    return json(
      { error: "Too many messages from this address. Please try again later." },
      429,
      { "retry-after": String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)) }
    );
  }

  if (!(await verifyTurnstile(turnstileToken, clientIp))) {
    return json({ error: "Verification failed. Please try again." }, 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return json({ error: "Server is not configured" }, 500);
  }

  const subjectName = name.replace(/[\r\n]+/g, " ").slice(0, 80);
  const subject = `New enquiry from ${subjectName}`;
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
