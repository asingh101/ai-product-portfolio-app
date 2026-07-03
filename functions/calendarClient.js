const { google } = require("googleapis");

function requireSecret(name, value) {
  if (!value) {
    const err = new Error(`${name} is not configured`);
    err.code = "MISSING_SECRET";
    throw err;
  }
  return value;
}

function getOAuth2Client({ clientId, clientSecret, refreshToken }) {
  const oauth2Client = new google.auth.OAuth2(
    requireSecret("GOOGLE_OAUTH_CLIENT_ID", clientId),
    requireSecret("GOOGLE_OAUTH_CLIENT_SECRET", clientSecret)
  );
  oauth2Client.setCredentials({
    refresh_token: requireSecret("GOOGLE_OAUTH_REFRESH_TOKEN", refreshToken),
  });
  return oauth2Client;
}

function getCalendarClient({ clientId, clientSecret, refreshToken }) {
  const auth = getOAuth2Client({ clientId, clientSecret, refreshToken });
  return google.calendar({ version: "v3", auth });
}

async function checkFreeBusy({
  calendar,
  calendarId,
  timeMinISO,
  timeMaxISO,
  timeZone,
}) {
  try {
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMinISO,
        timeMax: timeMaxISO,
        timeZone: timeZone || "America/Los_Angeles",
        items: [{ id: calendarId }],
      },
    });

    const busy = res?.data?.calendars?.[calendarId]?.busy;
    return Array.isArray(busy) ? busy : [];
  } catch (e) {
    const msg = e?.message || "";
    if (
      msg.includes("insufficient authentication scopes") ||
      e?.code === 403 ||
      e?.status === 403
    ) {
      return { error: "FREEBUSY_UNAVAILABLE" };
    }
    throw e;
  }
}

async function createOneOnOneEvent({
  calendar,
  calendarId,
  summary,
  description,
  startISO,
  endISO,
  timeZone,
  attendeeEmail,
  attendeeName,
}) {
  const res = await calendar.events.insert({
    calendarId,
    sendUpdates: "all",
    requestBody: {
      summary: summary || "1:1 with Ankit Singh",
      description: description || undefined,
      start: { dateTime: startISO, timeZone: timeZone || "America/Los_Angeles" },
      end: { dateTime: endISO, timeZone: timeZone || "America/Los_Angeles" },
      attendees: attendeeEmail
        ? [
            {
              email: attendeeEmail,
              displayName: attendeeName || undefined,
            },
          ]
        : undefined,
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: false,
    },
  });

  return res?.data;
}

async function cancelEvent({ calendar, calendarId, eventId }) {
  await calendar.events.delete({
    calendarId,
    eventId,
    sendUpdates: "all",
  });
}

module.exports = {
  getCalendarClient,
  checkFreeBusy,
  createOneOnOneEvent,
  cancelEvent,
};

