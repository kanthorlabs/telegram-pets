import { onSchedule } from "firebase-functions/v2/scheduler";
import admin from "firebase-admin";
import { ulid } from "ulid";
import fetch from "node-fetch";

import * as settings from "../settings";

export const petno_1 = onSchedule(
  { region: settings.FIREBASE_REGION, schedule: "every 3 minutes" },
  async () => {
    const ip = await fetch("https://api.ipify.org/").then((r) => r.text());
    const id = ulid();
    await admin.firestore().collection("ip").doc(id).set({ ip, id });
  }
);

export const petno_2 = onSchedule(
  { region: settings.FIREBASE_REGION, schedule: "every 5 minutes" },
  async () => {
    const ip = await fetch("https://api.ipify.org/").then((r) => r.text());
    const id = ulid();
    await admin.firestore().collection("ip").doc(id).set({ ip, id });
  }
);

export const petno_3 = onSchedule(
  { region: settings.FIREBASE_REGION, schedule: "every 7 minutes" },
  async () => {
    const ip = await fetch("https://api.ipify.org/").then((r) => r.text());
    const id = ulid();
    await admin.firestore().collection("ip").doc(id).set({ ip, id });
  }
);
