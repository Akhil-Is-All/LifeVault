const fs = require("node:fs");
const path = require("node:path");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

const projectId = "lifevault-acbcf";
const canonicalServiceAccountPath = path.join(
  __dirname,
  "firebase-service-account.json"
);
const existingServiceAccountPath = path.join(
  __dirname,
  "lifevault-acbcf-firebase-adminsdk-fbsvc-e450a9a9f4.json"
);

function initializeFirebaseAdmin() {
  const existingApp = getApps().find((app) => app.name === "[DEFAULT]");
  const app = existingApp || (() => {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      : fs.existsSync(canonicalServiceAccountPath)
        ? canonicalServiceAccountPath
        : existingServiceAccountPath;

    let serviceAccount;

    try {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    } catch {
      throw new Error(
        "Firebase Admin service account credentials are missing or invalid. " +
          "Set FIREBASE_SERVICE_ACCOUNT_PATH or place the credential JSON in backend/config."
      );
    }

    return initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  })();

  return getMessaging(app);
}

module.exports = { initializeFirebaseAdmin };