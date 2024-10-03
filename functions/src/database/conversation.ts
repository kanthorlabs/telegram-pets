import admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import * as yup from "yup";
import uniq from "lodash.uniq";

export const COLLECTION = "conversation";

export interface IConversation {
  thread_id: string;
  replies: string[];
  reply_cursor: number;
  reply_available: number;
  updated_at: number;
}

export function validate(conversation: IConversation): boolean {
  try {
    yup
      .object({
        thread_id: yup.string().required(),
        replies: yup.array(yup.string().required()).required(),
        url: yup.string().required().url(),
        reply_cursor: yup.number().min(0),
        reply_available: yup.number().min(0),
      })
      .validateSync(conversation);
    return true;
  } catch (err) {
    logger.error(
      `CONVERSATION.VALIDATION.ERROR: ${err} | ${JSON.stringify(conversation)}`
    );
    return false;
  }
}

export async function save(docs: IConversation[]) {
  if (docs.length === 0) return docs;

  return admin.firestore().runTransaction(async (tx) => {
    const records = await tx
      .getAll(
        ...docs.map((d) =>
          admin.firestore().collection(COLLECTION).doc(d.thread_id)
        )
      )
      .then((s) => s.map((d) => d.data() as IConversation).filter(Boolean));
    const maps = records.reduce(
      (m, r) => ({ ...m, [r.thread_id]: r }),
      {} as { [key: string]: IConversation }
    );

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];

      const ref = admin.firestore().collection(COLLECTION).doc(doc.thread_id);
      if (maps[doc.thread_id]) {
        const replies = uniq([...doc.replies, ...maps[doc.thread_id].replies]);
        const updates: Partial<IConversation> = {
          replies,
          reply_available: replies.length - doc.reply_cursor,
        };
        tx.update(ref, updates);

        docs[i] = { ...doc, ...updates };
        continue;
      }

      tx.set(ref, doc);
    }

    return docs;
  });
}

export async function pick(): Promise<IConversation | null> {
  return admin
    .firestore()
    .collection(COLLECTION)
    .where("reply_available", ">", 0)
    .orderBy("reply_available", "asc")
    .limit(1)
    .get()
    .then((s) => (s.empty ? null : (s.docs[0].data() as IConversation)));
}
