const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" })); // allow image uploads
app.use(express.static("public"));        // serve the 5Days frontend

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
[First line: "VALID" or "WARNING". Then explain. Check: notice period, signature, RLTO language, service method, address, math errors. If WARNING say "⚠️ POTENTIAL DEFECT:" then describe.]

---MISTAKES---
[3 or more numbered mistakes tenants commonly make in this situation.]

---DRAFT_LETTER---
[Professional letter with [TENANT NAME], [DATE], [ADDRESS] placeholders. Firm but non-confrontational.]

---NEXT_STEPS---
[Numbered checklist. Always end with:
• Chicago Eviction Help Line: 312-347-7600
• Metropolitan Tenants Organization: 773-292-4980
• Legal Aid Chicago: legalaidchicago.org
• Cook County Self-Help: cookcountycourt.org/selfhelp
• Illinois Legal Aid Online: illinoislegalaid.org]

RULES: Never skip a section. Never invent statute numbers. Never say a case is hopeless. Never say to ignore a notice or miss court. Treat the user with dignity — they are likely scared.`;

const SYSTEM_PROMPT_ES = SYSTEM_PROMPT + `\n\nIMPORTANT: The user has selected Spanish. Respond in Spanish for all section content, while keeping the ---SECTION--- markers in English exactly as shown.`;

// Rate limiting — simple in-memory store
const requestCounts = new Map();
const RATE_LIMIT = 20; // requests per hour per IP
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in ms

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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "5Days API" });
});

// Main analysis endpoint
app.post("/api/analyze", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: "Too many requests. Please try again in an hour, or contact the Chicago Eviction Help Line directly at 312-347-7600."
    });
  }

  const { content, lang } = req.body;

  if (!content || !Array.isArray(content) || content.length === 0) {
    return res.status(400).json({ error: "No notice content provided." });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY");
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: lang === "es" ? SYSTEM_PROMPT_ES : SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const text = message.content.map(b => b.type === "text" ? b.text : "").join("");
    res.json({ result: text });

  } catch (err) {
    console.error("Anthropic API error:", err.message);

    if (err.status === 401) {
      return res.status(500).json({ error: "API authentication failed. Please contact the administrator." });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: "Service is temporarily busy. Please try again in a moment." });
    }

    res.status(500).json({ error: "Analysis failed. Please try again, or call 312-347-7600 for immediate help." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 5Days server running on port ${PORT}`);
  console.log(`   Frontend: http://localhost:${PORT}`);
  console.log(`   API:      http://localhost:${PORT}/api/analyze`);
});
