import admin from "firebase-admin";
import path from "path";
import * as logger from "firebase-functions/logger";
import * as yup from "yup";
import * as telegram from "../libs/telegram";
import * as network from "../libs/network";

export const COLLECTION = "session";

export interface ISession {
  phone_number: string;
  id: string;
  access_hash: string;
  username: string;
  app_id: number;
  app_hash: string;
  session_key: string;
  updated_at: number;

  client_hosts: { [key: string]: number };
}

export function validate(session: ISession): boolean {
  try {
    yup
      .object({
        phone_number: yup.string().required(),
        id: yup.string().required(),
        username: yup.string().required(),
        access_hash: yup.string().required(),
        app_id: yup.number().min(0),
        app_hash: yup.string().required(),
        session_key: yup.string().required(),
      })
      .validateSync(session);
    return true;
  } catch (err) {
    logger.error(
      `SESSION.VALIDATION.ERROR: ${err} | ${JSON.stringify(session)}`
    );
    return false;
  }
}

export async function connect(
  filename: string,
  appId: number,
  appHash: string
): Promise<ISession | null> {
  const client = await telegram.connect(
    new telegram.SQLiteSession(filename),
    appId,
    appHash
  );
  const me = await client.getMe();

  const ip = await network.ip().catch(() => "-");
  const session: ISession = {
    phone_number: path.basename(filename, ".session"),
    id: me.id.toString(),
    username: me.username || me.id.toString(),
    access_hash: me.accessHash?.toString() || "",
    app_id: appId,
    app_hash: appHash,
    session_key: client.session.save() as any,
    updated_at: Date.now(),
    client_hosts: { [ip]: Date.now() },
  };
  if (!validate(session)) return null;
  return session;
}

export async function save(docs: ISession[]) {
  if (docs.length === 0) return docs;

  return admin.firestore().runTransaction(async (tx) => {
    const records = await tx
      .getAll(
        ...docs.map((d) =>
          admin.firestore().collection(COLLECTION).doc(d.phone_number)
        )
      )
      .then((s) => s.map((d) => d.data() as ISession).filter(Boolean));
    const maps = records.reduce(
      (m, r) => ({ ...m, [r.phone_number]: r }),
      {} as { [key: string]: ISession }
    );

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];

      const ref = admin
        .firestore()
        .collection(COLLECTION)
        .doc(doc.phone_number);
      if (maps[doc.phone_number]) {
        const updates: Partial<ISession> = {
          id: doc.id,
          username: doc.username,
          access_hash: doc.access_hash,
          app_id: doc.app_id,
          app_hash: doc.app_hash,
          session_key: doc.session_key,
          client_hosts: {
            ...doc.client_hosts,
            ...maps[doc.phone_number].client_hosts,
          },
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
