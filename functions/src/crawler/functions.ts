import { onSchedule } from "firebase-functions/v2/scheduler";
import * as settings from "../settings";
import * as threads from "./threads";
import * as replies from "./replies";

export const crawlerOfThreads = onSchedule(
  { region: settings.FIREBASE_REGION, schedule: "every 10 minutes" },
  async () => threads.run()
);

export const crawlerOfReplies = onSchedule(
  { region: settings.FIREBASE_REGION, schedule: "every 10 minutes" },
  async () => replies.run()
);
