import { onRequest } from "firebase-functions/v2/https";
import { use } from "./index";
import * as settings from "../settings";

export const api = onRequest({ region: settings.FIREBASE_REGION }, use());
