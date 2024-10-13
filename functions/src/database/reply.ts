import admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import * as yup from "yup";
import { ISession } from "./session";

export const COLLECTION = "reply";

export interface IReply {
  thread_id: string;
  id: string;
  url: string;
  content: string;
  author_username: string;
  updated_at: number;

  sender_session_phone_number: string;
  sender_assigned_at?: number;
  sender_sent_at: number;
}

export function validate(reply: IReply): boolean {
  try {
    yup
      .object({
        thread_id: yup.string().required(),
        id: yup.string().required(),
        url: yup.string().required().url(),
        content: yup.string().required(),
        author_username: yup.string().required(),
      })
      .validateSync(reply);
    return true;
  } catch (err) {
    logger.error(`REPLY.VALIDATION.ERROR: ${err} | ${JSON.stringify(reply)}`);
    return false;
  }
}

export async function save(docs: IReply[]) {
  if (docs.length === 0) return docs;

  return admin.firestore().runTransaction(async (tx) => {
    const snapshots = await tx.getAll(
      ...docs.map((d) => admin.firestore().collection(COLLECTION).doc(d.id))
    );
    const exists: { [name: string]: boolean } = snapshots.reduce(
      (m, s) => ({ ...m, [s.id]: s.exists }),
      {}
    );

    const returning: IReply[] = [];
    for (let doc of docs) {
      if (exists[doc.id]) continue;

      const ref = admin.firestore().collection(COLLECTION).doc(doc.id);
      tx.set(ref, doc);
      returning.push(doc);
    }

    return returning;
  });
}

export async function get(id: string): Promise<IReply | null> {
  const snapshot = await admin.firestore().collection(COLLECTION).doc(id).get();
  return snapshot.data() as IReply | null;
}

export function assign(session: ISession, limit = 10) {
  return admin.firestore().runTransaction(async (tx) => {
    const snapshots = await tx.get(
      admin
        .firestore()
        .collection(COLLECTION)
        .where("sender_session_phone_number", "==", "")
        .where("sender_sent_at", "==", 0)
        .orderBy("thread_id", "asc")
        .orderBy("updated_at", "asc")
        .limit(limit)
    );
    if (snapshots.empty) return [];

    const returning: IReply[] = [];
    for (let doc of snapshots.docs) {
      returning.push(doc.data() as IReply);
      tx.update(doc.ref, {
        sender_session_phone_number: session.phone_number,
        sender_assigned_at: Date.now(),
      });
    }

    return returning;
  });
}

export function pick(session: ISession, limit = 10) {
  return admin.firestore().runTransaction(async (tx) => {
    const snapshots = await tx.get(
      admin
        .firestore()
        .collection(COLLECTION)
        .where("sender_session_phone_number", "==", session.phone_number)
        .where("sender_sent_at", "==", 0)
        .orderBy("thread_id", "asc")
        .orderBy("updated_at", "asc")
        .limit(limit)
    );
    if (snapshots.empty) return [];

    const returning: IReply[] = [];
    for (let doc of snapshots.docs) {
      tx.update(doc.ref, { sender_sent_at: Date.now() });
      returning.push(doc.data() as IReply);
    }

    return returning;
  });
}
