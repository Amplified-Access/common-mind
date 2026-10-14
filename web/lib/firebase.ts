import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

// Locally the config points at the Firebase Auth Emulator's demo project
// (see web/.env.example), so no real Firebase project is needed.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;

let auth: Auth | null = null;

/** The browser's Firebase Auth instance, created on first use. */
function firebaseAuth(): Auth {
  if (auth) return auth;
  const app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  if (emulatorHost) {
    connectAuthEmulator(auth, `http://${emulatorHost}`, { disableWarnings: true });
  }
  return auth;
}

/** Whether the client has the config it needs to sign anyone in. */
const firebaseConfigured = Boolean(config.apiKey && config.projectId);

export { firebaseAuth, firebaseConfigured };
