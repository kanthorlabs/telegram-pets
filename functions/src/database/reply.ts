import { ulid } from "ulid";
import admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import * as yup from "yup";

export const COLLECTION = "reply";

export interface IReply {
  thread_id: string;
  id: string;
  url: string;
  content: string;
  author_username: string;
  updated_at: number;
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

  const batch = admin.firestore().batch();

  for (let i = 0; i < docs.length; i++) {
    if (!docs[i].id) docs[i].id = ulid();

    const ref = admin.firestore().collection(COLLECTION).doc(docs[i].id);
    batch.set(ref, docs[i], { merge: true });
  }

  await batch.commit();

  return docs;
}

export async function get(id: string): Promise<IReply | null> {
  const snapshot = await admin.firestore().collection(COLLECTION).doc(id).get();
  return snapshot.data() as IReply | null;
}

export async function list(threadId: string): Promise<{ docs: IReply[] }> {
  const docs = await admin
    .firestore()
    .collection(COLLECTION)
    .where("thread_id", "==", threadId)
    .orderBy("updated_at", "asc")
    .get()
    .then((s) => s.docs.map((d) => d.data() as IReply));
  if (docs.length === 0) return { docs: [] };
  return { docs };
}
