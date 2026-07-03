#!/usr/bin/env node
/**
 * One-time: obtain a Google OAuth refresh token for Calendar API.
 *
 * Prereqs:
 * 1. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Web).
 * 2. Add Authorized redirect URI: http://localhost:3000/oauth2callback
 * 3. Enable Google Calendar API on the project.
 *
 * Usage (from functions/):
 *   GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... node scripts/get-google-refresh-token.js
 *
 * Then open the printed URL, sign in, approve, copy the ?code= from the redirect URL
 * (browser may show "can't connect", that's OK; copy code from address bar).
 */

const readline = require("readline");
const { google } = require("googleapis");

const REDIRECT_URI = "http://localhost:3000/oauth2callback";
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in the environment."
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

console.log("\n1) Open this URL in your browser:\n\n", authUrl, "\n");
console.log(
  "2) After approving, you will be redirected to localhost (page may fail).\n" +
    "   Copy the FULL redirect URL from the address bar.\n" +
    "   It looks like: http://localhost:3000/oauth2callback?code=...\n"
);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("\nPaste the full redirect URL (or just the code): ", async (answer) => {
  rl.close();
  const trimmed = answer.trim();
  let code = trimmed;
  try {
    const u = new URL(trimmed);
    code = u.searchParams.get("code") || trimmed;
  } catch {
    // raw code string
  }
  if (!code) {
    console.error("No authorization code found.");
    process.exit(1);
  }
  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      console.error(
        "No refresh_token returned. Try revoking app access in Google Account → Security → Third-party access, then run again with prompt=consent (this script already sets it)."
      );
      console.log("Tokens:", tokens);
      process.exit(1);
    }
    console.log("\n--- Add this to Firebase secrets ---\n");
    console.log("GOOGLE_OAUTH_REFRESH_TOKEN=\n" + tokens.refresh_token + "\n");
  } catch (e) {
    console.error("Token exchange failed:", e.message || e);
    process.exit(1);
  }
});
