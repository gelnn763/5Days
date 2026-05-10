const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static("public"));

/**
 * =========================
 * SYSTEM PROMPT
 * =========================
 */
const SYSTEM_PROMPT = `You are 5Days, a specialized legal document decoder for renters in Chicago and Cook County, Illinois. You are not a lawyer and do not provide legal advice, but you are deeply knowledgeable about:
- Illinois Residential Tenants Act (ILCS Chapter 765, Acts 710–735)
- Chicago Residential Landlord and Tenant Ordinance (RLTO, Municipal Code Chapter 5-12)
- Illinois eviction procedure (735 ILCS 5/9-201 through 9-321)
- Cook County eviction court process

Respond ONLY in this exact format:

---NOTICE_TYPE---
[Name the notice type clearly. If unclear, say what info you need.]

---PLAIN_ENGLISH---
[2–4 sentences. Plain language, no jargon. What is the landlord doing and what happens if the tenant does nothing.]

---DEADLINE---
[State deadline directly. Note: day of service does NOT count. Keep to 1-2 sentences.]

---RIGHTS---
[3–6 specific rights, numbered list. Cite law by name where confident.]

---DEFECT_STATUS---
[First line: "VALID" or "WARNING". Then explain defects like notice period, signature, RLTO language, service method, address, math errors.]

---MISTAKES---
[3 or more numbered mistakes tenants commonly make in this situation.]

---DRAFT_LETTER---
[Professional letter with placeholders like [TENANT NAME], [DATE], [ADDRESS].]

---NEXT_STEPS---
[Numbered checklist. Always end with Chicago legal aid contacts.]

RULES: Never skip a section. Never invent statute numbers. Never tell users to ignore notices. Be calm and supportive.`;

const SYSTEM_PROMPT_ES = SYSTEM_PROMPT + `\n\nIMPORTANT: Respond in Spanish for all content sections.`;

/**
 * =========================
 * RATE LIMIT
 * =========================
 */
const requestCounts = new Map();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now - record.windowStart > RATE_WINDOW) {
    requestCounts.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= RATE_LIMIT) return false;

  record.count++;
  return true;
}

/**
 * =========================
 * HEALTH CHECK
 * =========================
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "5Days API" });
});

/**
 * =========================
 * FALLBACK (GUARANTEED WORKS)
 * =========================
 */
function fallbackResponse() {
  return `---NOTICE_TYPE---
Demo Mode Analysis

---PLAIN_ENGLISH---
We could not reach the AI service, so this is a fallback analysis. Your app is working correctly.

---DEADLINE---
Check your notice directly or consult legal aid.

---RIGHTS---
1. You still have tenant rights under Illinois law
2. Never ignore eviction notices
3. Seek legal help immediately if unsure

---DEFECT_STATUS---
WARNING
AI service unavailable, fallback mode used.

---MISTAKES---
1. Ignoring the notice
2. Missing court deadlines
3. Not seeking help early

---DRAFT_LETTER---
[DEMO MODE] AI unavailable. Please retry.

---NEXT_STEPS---
1. Try again later
2. Contact Legal Aid Chicago
3. Call 312-347-7600`;
}

/**
 * =========================
 * MAIN ANALYZE ENDPOINT
 * =========================
 */
app.post("/api/analyze", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: "Too many requests. Try again later."
    });
  }

  const { content, lang } = req.body;

  if (!content || !Array.isArray(content) || content.length === 0) {
    return res.status(400).json({ error: "No notice content provided." });
  }

  const userText = content.map(m => m.text || "").join("\n");

  /**
   * =========================
   * CHECK API KEY
   * =========================
   */
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("⚠️ Missing OPENROUTER_API_KEY → using fallback mode");
    return res.json({ result: fallbackResponse() });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://localhost",
        "X-Title": "5Days"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "system",
            content: lang === "es" ? SYSTEM_PROMPT_ES : SYSTEM_PROMPT
          },
          {
            role: "user",
            content: userText
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok || !data.choices?.[0]?.message?.content) {
      console.error("OpenRouter error:", data);
      return res.json({ result: fallbackResponse() });
    }

    res.json({ result: data.choices[0].message.content });

  } catch (err) {
    console.error("Server error:", err);
    res.json({ result: fallbackResponse() });
  }
});

/**
 * =========================
 * START SERVER
 * =========================
 */
app.listen(PORT, () => {
  console.log(`✅ 5Days server running on port ${PORT}`);
  console.log(`   Frontend: http://localhost:${PORT}`);
  console.log(`   API:      http://localhost:${PORT}/api/analyze`);
});