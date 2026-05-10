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
Unable to analyze at this time.

---PLAIN_ENGLISH---
Our AI analysis service is temporarily unavailable. Please try again in a moment.

---DEADLINE---
Do not wait for this tool — if you have an active eviction notice, contact the Chicago Eviction Help Line immediately at 312-347-7600.

---RIGHTS---
1. You have the right to contest any eviction in court
2. Contact legal aid immediately — do not ignore any deadlines
3. Chicago Eviction Help Line: 312-347-7600

---DEFECT_STATUS---
VALID
Unable to check for defects without AI analysis. Please contact legal aid.

---MISTAKES---
1. Do not ignore the notice or any court dates
2. Do not wait — contact legal aid today
3. Do not move out without a written agreement

---DRAFT_LETTER---
Please contact legal aid for help drafting a response:
Legal Aid Chicago: legalaidchicago.org

---NEXT_STEPS---
1. Call the Chicago Eviction Help Line: 312-347-7600
2. Contact Legal Aid Chicago: legalaidchicago.org
3. Do not miss any court dates`;
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