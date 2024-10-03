import "dotenv/config";
import * as settings from "../settings";
import admin from "firebase-admin";

admin.initializeApp({
  projectId: settings.GCLOUD_PROJECT,
  storageBucket: settings.FIREBASE_STORAGE_BUCKET,
});
admin.firestore().settings({ ignoreUndefinedProperties: true });
