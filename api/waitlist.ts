import type { VercelRequest, VercelResponse } from "@vercel/node"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_SEGMENT_ID = process.env.RESEND_SEGMENT_ID
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  if (!RESEND_API_KEY || !RESEND_SEGMENT_ID) {
    return res.status(500).json({ error: "Server not configured" })
  }

  const { email, current, useCase } = req.body

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required" })
  }

  try {
    let contactId: string | null = null

    // 1. Create or find contact
    const contactRes = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        unsubscribed: false,
        properties: {
          current_tools: (current || []).join(", ") || "none",
          use_case: useCase || "",
        },
      }),
    })

    if (contactRes.ok) {
      const data = await contactRes.json()
      contactId = data.id
    } else if (contactRes.status !== 422) {
      const body = await contactRes.text()
      console.error("Resend contact error:", contactRes.status, body)
      return res.status(500).json({ error: "Failed to subscribe" })
    }
    // 422 = already exists — still proceed

    // 2. Add to segment (separate call)
    await fetch(
      `https://api.resend.com/contacts/${encodeURIComponent(email)}/segments/${RESEND_SEGMENT_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    ).catch(() => {})

    console.log(
      `[waitlist] ${email} | tools: ${(current || []).join(", ") || "none"} | use-case: ${useCase || "n/a"}`,
    )

    // 3. Confirmation email
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Gatelit <hello@gatelit.dev>",
        to: email,
        replyTo: "hello@gatelit.dev",
        subject: "You're on the Gatelit waitlist",
        text: [
          "Thanks for signing up.",
          "",
          "We're opening access in small batches as we gather feedback from early users. We'll reach out when your spot is ready.",
          "",
          "In the meantime, if you want to share what you're using for prompt management today (and where it falls short), just reply to this email — we read every response.",
          "",
          "You can also open a discussion at https://github.com/dbssman/gatelit-public/discussions",
          "",
          "- Gatelit",
        ].join("\n"),
      }),
    }).catch(() => {})

    // 4. Notification to you
    if (NOTIFY_EMAIL) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Gatelit Waitlist <waitlist@gatelit.dev>",
          to: NOTIFY_EMAIL,
          subject: `New waitlist signup: ${email}`,
          text: [
            `Email: ${email}`,
            `Current tools: ${(current || []).join(", ") || "none"}`,
            `Use case: ${useCase || "n/a"}`,
          ].join("\n"),
        }),
      }).catch(() => {})
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error("Waitlist error:", error)
    return res.status(500).json({ error: "Internal error" })
  }
}
