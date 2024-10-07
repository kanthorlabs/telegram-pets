import admin from "firebase-admin";
import * as yup from "yup";

export const COLLECTION = "thread";
export interface IThread {
  id: string;
  url: string;
  title: string;
  author_username: string;
  statstics_replies: number;
  statstics_views: number;
  updated_at: number;

  crawler_page_max: number;
  crawler_page_cur?: admin.firestore.FieldValue | number;
}

export function validate(thread: IThread): boolean {
  try {
    yup
      .object({
        id: yup.string().required(),
        url: yup.string().required().url(),
        title: yup.string().required(),
        author_username: yup.string().required(),
        statstics_replies: yup.number().required(),
        statstics_views: yup.number().required(),
        crawler_page_max: yup.number().required(),
      })
      .validateSync(thread);
    return true;
  } catch {
    return false;
  }
}

export async function save(docs: IThread[]) {
  if (docs.length === 0) return docs;

  const batch = admin.firestore().batch();

  for (let i = 0; i < docs.length; i++) {
    docs[i].crawler_page_cur = admin.firestore.FieldValue.increment(1);

    const ref = admin.firestore().collection(COLLECTION).doc(docs[i].id);
    batch.set(ref, docs[i], { merge: true });
  }

  await batch.commit();

  return docs;
}

export async function get(id: string): Promise<IThread | null> {
  const snapshot = await admin.firestore().collection(COLLECTION).doc(id).get();
  return snapshot.data() as IThread | null;
}

export async function list(
  limit = 10,
  cursor = 0
): Promise<{ docs: IThread[]; cursor: number }> {
  const docs = await admin
    .firestore()
    .collection(COLLECTION)
    .where("updated_at", ">", cursor)
    .orderBy("updated_at", "asc")
    .limit(limit)
    .get()
    .then((s) => s.docs.map((d) => d.data() as IThread));
  if (docs.length === 0) return { docs: [], cursor: 0 };
  // last page
  if (docs.length === limit) {
    return { docs, cursor: docs[docs.length - 1].updated_at };
  }
  return { docs, cursor: 0 };
}
