import { onSchedule } from "firebase-functions/v2/scheduler";

import * as settings from "../settings";

export const firstpet = onSchedule(
  { region: settings.FIREBASE_REGION, schedule: "every 10 minutes" },
  async () => {}
);
