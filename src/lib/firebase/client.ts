import {
  initializeApp,
  getApp,
  getApps,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function lazyInstance<T extends object>(factory: () => T): T {
  let instance: T | undefined;
  return new Proxy({} as T, {
    get(_target, prop) {
      instance ??= factory();
      const value = Reflect.get(instance, prop);
      return typeof value === "function" ? value.bind(instance) : value;
    },
    has(_target, prop) {
      instance ??= factory();
      return Reflect.has(instance, prop);
    },
  });
}

function createApp(): FirebaseApp {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
      "Firebase config missing: set the NEXT_PUBLIC_FIREBASE_* environment variables before building."
    );
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const app: FirebaseApp = lazyInstance(createApp);
export const auth: Auth = lazyInstance(() => getAuth(app));
export const db: Firestore = lazyInstance(() => getFirestore(app));
export const storage: FirebaseStorage = lazyInstance(() => getStorage(app));
