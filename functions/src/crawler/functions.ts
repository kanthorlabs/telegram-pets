import { onSchedule } from "firebase-functions/v2/scheduler";
import * as settings from "../settings";
import * as threads from "./threads";
import * as replies from "./replies";

export const crawlerOfThreads = onSchedule(
  {
    region: settings.FIREBASE_REGION,
    schedule: "every 59 minutes",
    timeoutSeconds: 540,
  },
  async () => threads.run()
);

export const crawlerOfReplies = onSchedule(
  {
    region: settings.FIREBASE_REGION,
    schedule: "every 29 minutes",
    timeoutSeconds: 540,
  },
  async () => replies.run()
);
