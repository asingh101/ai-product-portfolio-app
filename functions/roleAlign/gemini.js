const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

async function callGeminiJson({ apiKey, model, systemText, userText, temperature, maxOutputTokens }) {
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    system_instruction: { parts: [{ text: systemText }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.text();
    const err = new Error("Gemini API error");
    err.status = res.status;
    err.details = errData;
    throw err;
  }

  return res.json();
}

/** Stream plain-text Gemini output via SSE (alt=sse). Yields { text, raw } per chunk. */
async function* streamGeminiText({
  apiKey,
  model,
  systemText,
  userText,
  temperature = 0.35,
  maxOutputTokens = 900,
}) {
  const url = `${GEMINI_API_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const body = {
    system_instruction: { parts: [{ text: systemText }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.text();
    const err = new Error("Gemini API error");
    err.status = res.status;
    err.details = errData;
    throw err;
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  const processBlock = (block) => {
    for (const line of block.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const raw = JSON.parse(payload);
        const parts = raw?.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        const text = parts.map((p) => (typeof p.text === "string" ? p.text : "")).join("");
        if (text) return { text, raw };
      } catch {
        /* skip malformed chunk */
      }
    }
    return null;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

    let sep;
    while ((sep = buffer.indexOf("\n\n")) >= 0) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const parsed = processBlock(block);
      if (parsed) yield parsed;
    }
  }

  if (buffer.trim()) {
    const parsed = processBlock(buffer);
    if (parsed) yield parsed;
  }
}

function extractText(data) {
  const candidate = data?.candidates?.[0];
  if (!candidate?.content?.parts) {
    const reason = candidate?.finishReason || data?.promptFeedback?.blockReason;
    if (reason) {
      console.warn("[RoleAlign] Gemini empty candidate:", reason);
    }
    return "";
  }
  return (
    candidate.content.parts
      .map((p) => (typeof p.text === "string" ? p.text : ""))
      .join("")
      .trim() || ""
  );
}

function getFinishReason(data) {
  return data?.candidates?.[0]?.finishReason || null;
}

module.exports = { callGeminiJson, streamGeminiText, extractText, getFinishReason, GEMINI_API_BASE };
