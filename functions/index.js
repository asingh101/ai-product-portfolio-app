const { onRequest } = require("firebase-functions/v2/https");
const functionsV1 = require("firebase-functions/v1");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const logoDevSk = defineSecret("LOGO_DEV_SK");
const googleOauthClientId = defineSecret("GOOGLE_OAUTH_CLIENT_ID");
const googleOauthClientSecret = defineSecret("GOOGLE_OAUTH_CLIENT_SECRET");
const googleOauthRefreshToken = defineSecret("GOOGLE_OAUTH_REFRESH_TOKEN");
const googleCalendarIdSecret = defineSecret("GOOGLE_CALENDAR_ID");

const {
  getCalendarClient,
  checkFreeBusy,
  createOneOnOneEvent,
  cancelEvent,
} = require("./calendarClient");

const MODEL_ID = "gemini-3.1-flash-lite-preview";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const DEFAULT_TIME_ZONE = "America/Los_Angeles";
const DEFAULT_DURATION_MINUTES = 60;

function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const e = email.trim();
  if (!e) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function addMinutesToISO(iso, minutes) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

function normalizeISO(iso) {
  if (typeof iso !== "string") return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// ── RAG Context Loader (Firestore-backed) ──
async function loadRagContext() {
  try {
    // Avoid composite index requirement by not combining where + orderBy.
    // We'll fetch active docs and sort in-memory by sortOrder.
    const snap = await db
      .collection("rag_context")
      .where("status", "==", "active")
      .get();

    if (snap.empty) {
      console.warn("[RAG] No active context documents found in Firestore");
      return "";
    }

    const docs = snap.docs
      .map((d) => d.data())
      .sort((a, b) => {
        const as = typeof a.sortOrder === "number" ? a.sortOrder : 0;
        const bs = typeof b.sortOrder === "number" ? b.sortOrder : 0;
        return as - bs;
      });

    return docs.map((d) => d.content || "").join("\n\n---\n\n");
  } catch (err) {
    console.error("[RAG] Failed to load context from Firestore:", err);
    return "";
  }
}

async function buildSystemPrompt() {
  const ragContext = await loadRagContext();
  return `You are Ankit's AI Assistant, Ankit Singh's personal AI concierge embedded on his portfolio website. Help visitors learn about Ankit's background, projects, experience, and skills.

## Core Rules
1. **Identity:** Speak as a knowledgeable proxy for Ankit. Use "Ankit" (third person). Be professional and warm, never stiff or overly casual.
2. **Names:** If the visitor introduces themselves, use their name naturally. Do NOT ask for a name, just respond to their question.
3. **Scope:** Only answer using the knowledge base below. If asked about something outside scope, redirect: "I'm focused on Ankit's professional background. Can I help with something about his experience or projects?"
4. **Accuracy:** Never fabricate. If unsure: "I don't have details on that specifically, but I can share [related topic]."
5. **Conciseness:** Default to 2-3 sentences. Expand only when the user explicitly asks for detail. Use bullet points for 3+ items. No filler phrases ("Great question!", "Absolutely!", "That's a fantastic question!"). Lead with the answer.
6. **Navigation:** Include markdown links to relevant pages when your answer relates to site content. Use the navigation map below.
7. **Redirect Directive:** When the user's question is primarily answered by visiting a page (e.g. "show me his resume", "I want to see projects"), include the directive {{navigate:/path}} at the END of your response. Only one per message.
8. **Scheduling:** You CAN schedule or cancel 1:1 appointments by using the available scheduling tools. If the user asks to book/cancel a 1:1 and you don't have an email address for the visitor, ask for their email in one sentence. Default timezone is ${DEFAULT_TIME_ZONE} unless the user specifies otherwise. Do not claim you lack calendar access when the tools succeed.

## Site Navigation Map
Use these exact markdown links when referencing pages:
- Career history, timeline, skills → [Resume page](/resume)
- Case studies, projects → [Portfolio page](/portfolio)
- Conferences, hackathons, events → [Events page](/events)
- Articles, thought leadership → [Blog page](/blog)
- Booking, mentorship, email → [Contact page](/contact)
- LinkedIn posts, social → [LinkedIn page](/linkedin)

## Knowledge Base
${ragContext}

## Response Format
- Markdown formatting (bold, bullets) for scannability
- Keep responses focused, no padding or pleasantries
- End with a brief follow-up suggestion when natural (not every message)
- For mentorship interest, link to [Contact page](/contact)`;
}

function getSchedulingTools() {
  return [
    {
      functionDeclarations: [
        {
          name: "schedule_create",
          description:
            "Create a 1:1 appointment on Ankit's calendar and invite the attendee by email.",
          parameters: {
            type: "object",
            properties: {
              startISO: {
                type: "string",
                description:
                  "Start datetime in ISO-8601 (e.g. 2026-04-10T23:00:00.000Z).",
              },
              endISO: {
                type: "string",
                description:
                  "End datetime in ISO-8601. Optional if durationMinutes is provided.",
              },
              durationMinutes: {
                type: "integer",
                description: "Optional duration in minutes (default 60).",
              },
              timeZone: {
                type: "string",
                description:
                  `IANA timezone (default ${DEFAULT_TIME_ZONE}).`,
              },
              attendeeEmail: {
                type: "string",
                description:
                  "Visitor email address for the calendar invite (required).",
              },
              attendeeName: {
                type: "string",
                description: "Visitor display name, if known.",
              },
              summary: {
                type: "string",
                description: "Optional calendar event title.",
              },
              description: {
                type: "string",
                description: "Optional event description.",
              },
            },
            required: ["startISO"],
          },
        },
        {
          name: "schedule_cancel",
          description:
            "Cancel a previously booked 1:1 appointment and send cancellation updates to the attendee.",
          parameters: {
            type: "object",
            properties: {
              eventId: {
                type: "string",
                description:
                  "Google Calendar eventId, if known. Preferred for cancellation.",
              },
              startISO: {
                type: "string",
                description:
                  "Start datetime in ISO-8601 used to look up the booking when eventId isn't known.",
              },
              attendeeEmail: {
                type: "string",
                description:
                  "Visitor email used to look up the booking when eventId isn't known.",
              },
              timeZone: {
                type: "string",
                description:
                  `IANA timezone (default ${DEFAULT_TIME_ZONE}).`,
              },
            },
            required: [],
          },
        },
      ],
    },
  ];
}

function isSchedulingIntent(text) {
  if (typeof text !== "string") return false;
  const t = text.toLowerCase();
  const hasAction = /(book|schedule|reschedule|cancel)/.test(t);
  const hasMeeting = /(1:1|one[- ]on[- ]one|meeting|call|session)/.test(t);
  return hasAction && hasMeeting;
}

async function executeSchedulingToolCall({
  toolName,
  args,
  visitorEmail,
  visitorName,
}) {
  const calendarId = googleCalendarIdSecret.value() || "primary";
  const calendar = getCalendarClient({
    clientId: googleOauthClientId.value(),
    clientSecret: googleOauthClientSecret.value(),
    refreshToken: googleOauthRefreshToken.value(),
  });

  if (toolName === "schedule_create") {
    const startISO = normalizeISO(args?.startISO);
    if (!startISO) {
      return { ok: false, error: "INVALID_START", message: "Invalid start time." };
    }

    const durationMinutesRaw =
      typeof args?.durationMinutes === "number" ? args.durationMinutes : null;
    const durationMinutes =
      durationMinutesRaw && durationMinutesRaw > 0 && durationMinutesRaw <= 180
        ? Math.floor(durationMinutesRaw)
        : DEFAULT_DURATION_MINUTES;

    const endISO = normalizeISO(args?.endISO) || addMinutesToISO(startISO, durationMinutes);
    if (!endISO) {
      return { ok: false, error: "INVALID_END", message: "Invalid end time." };
    }

    const timeZone =
      typeof args?.timeZone === "string" && args.timeZone.trim()
        ? args.timeZone.trim()
        : DEFAULT_TIME_ZONE;

    const attendeeEmailCandidate =
      typeof args?.attendeeEmail === "string" && args.attendeeEmail.trim()
        ? args.attendeeEmail.trim()
        : visitorEmail || "";

    if (!isValidEmail(attendeeEmailCandidate)) {
      return {
        ok: false,
        error: "MISSING_EMAIL",
        message: "Attendee email is required to send a calendar invite.",
      };
    }

    const busy = await checkFreeBusy({
      calendar,
      calendarId,
      timeMinISO: startISO,
      timeMaxISO: endISO,
      timeZone,
    });

    // `freeBusy` requires broader scopes than calendar.events in some cases.
    // If it fails due to scopes/permissions, proceed without availability checking.
    if (busy && busy.error === "FREEBUSY_UNAVAILABLE") {
      // proceed
    } else if (Array.isArray(busy) && busy.length > 0) {
      return {
        ok: false,
        error: "TIME_UNAVAILABLE",
        message: "That time is not available.",
        busy,
      };
    }

    const event = await createOneOnOneEvent({
      calendar,
      calendarId,
      summary: typeof args?.summary === "string" ? args.summary : undefined,
      description:
        typeof args?.description === "string" ? args.description : undefined,
      startISO,
      endISO,
      timeZone,
      attendeeEmail: attendeeEmailCandidate,
      attendeeName:
        typeof args?.attendeeName === "string"
          ? args.attendeeName
          : visitorName || undefined,
    });

    const eventId = event?.id;
    if (!eventId) {
      return { ok: false, error: "CREATE_FAILED", message: "Failed to create event." };
    }

    await db.collection("chat_calendar_bookings").doc(eventId).set(
      {
        eventId,
        attendeeEmail: attendeeEmailCandidate.toLowerCase(),
        startISO,
        endISO,
        timeZone,
        visitorName: visitorName || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      ok: true,
      eventId,
      htmlLink: event?.htmlLink || null,
      startISO,
      endISO,
      timeZone,
    };
  }

  if (toolName === "schedule_cancel") {
    const timeZone =
      typeof args?.timeZone === "string" && args.timeZone.trim()
        ? args.timeZone.trim()
        : DEFAULT_TIME_ZONE;

    let eventId =
      typeof args?.eventId === "string" && args.eventId.trim()
        ? args.eventId.trim()
        : null;

    if (!eventId) {
      const startISO = normalizeISO(args?.startISO);
      const attendeeEmailCandidate =
        typeof args?.attendeeEmail === "string" && args.attendeeEmail.trim()
          ? args.attendeeEmail.trim()
          : visitorEmail || "";

      if (!startISO || !isValidEmail(attendeeEmailCandidate)) {
        return {
          ok: false,
          error: "MISSING_LOOKUP_INFO",
          message:
            "To cancel, provide the booking start time and your email (or an event id).",
        };
      }

      const snap = await db
        .collection("chat_calendar_bookings")
        .where("attendeeEmail", "==", attendeeEmailCandidate.toLowerCase())
        .where("startISO", "==", startISO)
        .limit(1)
        .get();

      if (snap.empty) {
        return {
          ok: false,
          error: "NOT_FOUND",
          message: "I couldn't find a booking matching that time and email.",
        };
      }

      const d = snap.docs[0].data();
      eventId = typeof d.eventId === "string" ? d.eventId : snap.docs[0].id;
    }

    await cancelEvent({ calendar, calendarId, eventId });
    await db.collection("chat_calendar_bookings").doc(eventId).delete().catch(() => {});

    return { ok: true, eventId, timeZone };
  }

  return { ok: false, error: "UNKNOWN_TOOL", message: "Unknown tool call." };
}

async function callGemini({ apiKey, body }) {
  const url = `${GEMINI_API_BASE}/models/${MODEL_ID}:generateContent?key=${apiKey}`;
  const geminiRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!geminiRes.ok) {
    const errData = await geminiRes.text();
    const err = new Error("Gemini API error");
    err.status = geminiRes.status;
    err.details = errData;
    throw err;
  }

  return await geminiRes.json();
}

const { createRoleAlignHandler } = require("./roleAlign/handler");
const { createFetchProfileHandler } = require("./roleAlign/fetchProfile");
const { createResumeOptimizerHandler } = require("./resumeOptimizer/handler");
const { createRecordToolUsageHandler } = require("./analytics/recordToolUsage");
const { createRunAgentToolHandler } = require("./jobSearchAgent/handler");

// ── RoleAlign Profile Fetch (Proxycurl) ──
exports.roleAlignFetchProfile = onRequest(
  {
    cors: true,
    invoker: "public",
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 30,
  },
  createFetchProfileHandler()
);

// ── RoleAlign Analysis (SSE + JSON) ──
exports.roleAlignAnalyze = onRequest(
  {
    cors: true,
    invoker: "public",
    secrets: [geminiApiKey],
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  createRoleAlignHandler({ db, geminiApiKey })
);

// ── Resume Optimizer Analysis (SSE + JSON) ──
exports.resumeOptimizerAnalyze = onRequest(
  {
    cors: true,
    invoker: "public",
    secrets: [geminiApiKey],
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  createResumeOptimizerHandler({ db, geminiApiKey })
);

// ── Agentic Job Search, tool gateway (ping + future tools) ──
exports.runAgentTool = onRequest(
  {
    cors: true,
    invoker: "public",
    secrets: [geminiApiKey],
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  createRunAgentToolHandler({ geminiApiKey })
);

// ── Tool usage analytics ──
exports.recordToolUsage = onRequest(
  {
    cors: true,
    invoker: "public",
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 10,
  },
  createRecordToolUsageHandler({ db })
);

// ── Chat Cloud Function ──
exports.chat = onRequest(
  {
    cors: true,
    invoker: "public",
    secrets: [
      geminiApiKey,
      googleOauthClientId,
      googleOauthClientSecret,
      googleOauthRefreshToken,
      googleCalendarIdSecret,
    ],
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { messages, visitorName, visitorEmail } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: "Messages array is required" });
        return;
      }

      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        res.status(500).json({ error: "Gemini API key not configured" });
        return;
      }

      const systemPrompt = await buildSystemPrompt();
      const lastMessage = messages[messages.length - 1];
      const history = messages.slice(0, -1);
      const rawUserText = typeof lastMessage?.content === "string" ? lastMessage.content : "";

      const safeVisitorEmail = isValidEmail(visitorEmail) ? visitorEmail.trim() : null;
      const prefixParts = [];
      if (visitorName && visitorName !== "there") prefixParts.push(`Visitor: ${visitorName}`);
      if (safeVisitorEmail) prefixParts.push(`VisitorEmail: ${safeVisitorEmail}`);
      const userText = prefixParts.length
        ? `[${prefixParts.join(" | ")}] ${lastMessage.content}`
        : lastMessage.content;

      const contents = [
        ...history.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
        { role: "user", parts: [{ text: userText }] },
      ];

      const tools = getSchedulingTools();
      const baseBody = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        tools,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 800,
          topP: 0.85,
        },
      };

      let data;
      try {
        data = await callGemini({ apiKey, body: baseBody });
      } catch (e) {
        console.error("[Gemini API Error]", e.status || "?", e.details || e.message);
        res.status(502).json({ error: "Gemini API error", details: e.details || e.message });
        return;
      }

      const candidate = data?.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const functionCallPart = parts.find((p) => p.functionCall);

      // If the user is trying to book/cancel and the model didn't call a tool,
      // force a function call to avoid hallucinated confirmations.
      let forcedFunctionCallPart = null;
      if (!functionCallPart && isSchedulingIntent(rawUserText)) {
        const forcedBody = {
          ...baseBody,
          toolConfig: {
            functionCallingConfig: {
              mode: "ANY",
              allowedFunctionNames: ["schedule_create", "schedule_cancel"],
            },
          },
          generationConfig: {
            ...baseBody.generationConfig,
            temperature: 0,
            maxOutputTokens: 256,
          },
        };

        try {
          const forcedData = await callGemini({ apiKey, body: forcedBody });
          const forcedParts = forcedData?.candidates?.[0]?.content?.parts || [];
          forcedFunctionCallPart = forcedParts.find((p) => p.functionCall) || null;
        } catch (e) {
          console.error(
            "[Gemini API Error forced function call]",
            e.status || "?",
            e.details || e.message
          );
        }
      }

      // Tool-calling loop (max 2 calls per request)
      const effectiveFunctionCallPart = functionCallPart || forcedFunctionCallPart;
      if (effectiveFunctionCallPart?.functionCall?.name) {
        const toolName = effectiveFunctionCallPart.functionCall.name;
        const args = effectiveFunctionCallPart.functionCall.args || {};

        let toolResult;
        try {
          toolResult = await executeSchedulingToolCall({
            toolName,
            args,
            visitorEmail: safeVisitorEmail,
            visitorName: visitorName && visitorName !== "there" ? visitorName : null,
          });
        } catch (err) {
          console.error("[Scheduling Tool Error]", err);
          toolResult = {
            ok: false,
            error: "TOOL_FAILED",
            message: "Scheduling failed due to an internal error.",
          };
        }

        const toolContents = [
          ...contents,
          { role: "model", parts: [effectiveFunctionCallPart] },
          {
            role: "user",
            parts: [
              {
                functionResponse: {
                  name: toolName,
                  response: toolResult,
                },
              },
            ],
          },
        ];

        const followupBody = {
          ...baseBody,
          contents: toolContents,
          toolConfig: {
            functionCallingConfig: { mode: "AUTO" },
          },
        };

        try {
          data = await callGemini({ apiKey, body: followupBody });
        } catch (e) {
          console.error("[Gemini API Error followup]", e.status || "?", e.details || e.message);
          res.status(502).json({ error: "Gemini API error", details: e.details || e.message });
          return;
        }
      }

      const finalText =
        data?.candidates?.[0]?.content?.parts
          ?.map((p) => (typeof p.text === "string" ? p.text : ""))
          .join("")
          .trim() ||
        "I couldn't generate a response. Please try again.";

      res.json({ message: finalText });
    } catch (error) {
      console.error("[Chat Function Error]", error);
      res
        .status(500)
        .json({ error: "Failed to generate response", details: error.message });
    }
  }
);

// ── Logo Domain Search ──
exports.logoSearch = onRequest(
  {
    cors: true,
    invoker: "public",
    secrets: [logoDevSk],
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 15,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { companyName } = req.body;
      const trimmed = (companyName || "").trim();
      if (!trimmed) {
        res.status(400).json({ domain: null, error: "Empty company name" });
        return;
      }

      const sk = logoDevSk.value();
      if (!sk) {
        res.status(500).json({ domain: null, error: "Logo.dev key not configured" });
        return;
      }

      const url = `https://api.logo.dev/search?q=${encodeURIComponent(trimmed)}`;
      const apiRes = await fetch(url, {
        headers: { Authorization: `Bearer ${sk}` },
        signal: AbortSignal.timeout(8000),
      });

      if (!apiRes.ok) {
        res.json({ domain: null, error: `Logo.dev API returned ${apiRes.status}` });
        return;
      }

      const data = await apiRes.json();
      if (!Array.isArray(data) || data.length === 0) {
        res.json({ domain: null });
        return;
      }

      res.json({ domain: data[0].domain });
    } catch (error) {
      console.error("[Logo Search Error]", error);
      res.json({ domain: null, error: error.message || "Unknown error" });
    }
  }
);

// ── Report download lead → optional webhook notification ──
// Emails are stored in Firestore: collection `report_download_leads`.
// Set env REPORT_DOWNLOAD_WEBHOOK on this function (Slack or Discord webhook URL) in Google Cloud Console.
// (v1 Firestore trigger avoids Eventarc setup issues some projects hit on first v2 Firestore deploy.)
exports.onReportDownloadLeadCreated = functionsV1
  .region("us-central1")
  .runWith({ memory: "256MB", timeoutSeconds: 30 })
  .firestore.document("report_download_leads/{leadId}")
  .onCreate(async (snap) => {
    const d = snap.data();
    const email = typeof d.email === "string" ? d.email : "?";
    const slug = typeof d.projectSlug === "string" ? d.projectSlug : "?";
    const body = `Someone has downloaded the report.\n\nProject: ${slug}\nEmail: ${email}`;

    console.log("[report_download_leads]", body);

    const url = (process.env.REPORT_DOWNLOAD_WEBHOOK || "").trim();
    if (!url.startsWith("https://")) return;

    const isDiscord = url.includes("discord.com/api/webhooks");
    const payload = isDiscord ? { content: body } : { text: body };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error("[report_download notify] webhook failed", res.status, t);
      }
    } catch (err) {
      console.error("[report_download notify] webhook error", err);
    }
  });
