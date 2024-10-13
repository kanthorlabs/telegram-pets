import { onSchedule } from "firebase-functions/v2/scheduler";
import * as settings from "../settings";
import { simple } from "./handler";

export const petno_1 = onSchedule(
  {
    region: settings.FIREBASE_REGION,
    schedule: "*/15 0-1 * * *",
  },
  async () => {
    await simple("no_1");
  }
);
