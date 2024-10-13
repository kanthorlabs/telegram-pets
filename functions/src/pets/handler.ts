import admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { ulid } from "ulid";
import * as utils from "../utils";
import * as database from "../database";
import * as telegram from "./telegram";
import { LOCK_DURATION } from "./constants";

export async function simple(name: string, phone?: string) {
  const ip = await utils.ip();
  const id = ulid();
  await admin.firestore().collection("ip").doc(id).set({ id, ip, name });

  return admin.firestore().runTransaction(async (tx) => {
    const session = await get(tx, phone);
    if (!session) {
      logger.error(`PETS.HANDLER.SIMPLE.ERROR: no session is available`, {
        name,
      });
      return [];
    }

    await lock(tx, session);
    const messages = await telegram.send(session);
    for (const message of messages) {
      console.log(message.replace("/", " -> "));
    }
    console.log(`PETS.HANDLER.SIMPLE ${messages.length} messages`);
    return messages;
  });
}

async function get(tx: admin.firestore.Transaction, phone?: string) {
  if (phone) {
    return tx
      .get(admin.firestore().collection(database.session.COLLECTION).doc(phone))
      .then((s) => s.data() as database.session.ISession | null);
  }

  return tx
    .get(
      admin
        .firestore()
        .collection(database.session.COLLECTION)
        .where("lock_expired_at", "<", Date.now())
        .limit(1)
    )
    .then((s) =>
      s.docs.length > 0 ? (s.docs[0].data() as database.session.ISession) : null
    );
}

async function lock(
  tx: admin.firestore.Transaction,
  session: database.session.ISession,
  duration = LOCK_DURATION
) {
  const ref = admin
    .firestore()
    .collection(database.session.COLLECTION)
    .doc(session.phone_number);
  tx.update(ref, { lock_expired_at: Date.now() + duration });
}
