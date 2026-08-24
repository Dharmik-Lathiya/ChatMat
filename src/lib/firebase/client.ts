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
  const resolve = (): T => (instance ??= factory());
  return new Proxy({} as T, {
    get(_target, prop) {
      const value = Reflect.get(resolve(), prop);
      return typeof value === "function" ? value.bind(resolve()) : value;
    },
    has(_target, prop) {
      return Reflect.has(resolve(), prop);
    },
    getPrototypeOf() {
      return Reflect.getPrototypeOf(resolve());
    },
    setPrototypeOf(_target, proto) {
      return Reflect.setPrototypeOf(resolve(), proto);
    },
    ownKeys() {
      return Reflect.ownKeys(resolve());
    },
    getOwnPropertyDescriptor(_target, prop) {
      const desc = Reflect.getOwnPropertyDescriptor(resolve(), prop);
      if (desc) desc.configurable = true;
      return desc;
    },
    defineProperty(_target, prop, desc) {
      return Reflect.defineProperty(resolve(), prop, desc);
    },
    deleteProperty(_target, prop) {
      return Reflect.deleteProperty(resolve(), prop);
    },
    set(_target, prop, value) {
      return Reflect.set(resolve(), prop, value);
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
