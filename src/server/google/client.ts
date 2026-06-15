// server/google/client.ts
//
// Builds authenticated Google API clients from the service account credentials.
// The service account gets its access by being SHARED on the Drive folder and
// the Sheet — not through IAM roles.

import { google } from "googleapis";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Env vars store the key with literal "\n"; turn them into real newlines.
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY env vars",
    );
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
}

export function getDrive() {
  return google.drive({ version: "v3", auth: getAuth() });
}

export function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}