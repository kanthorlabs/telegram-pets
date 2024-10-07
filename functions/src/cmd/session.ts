import { StringSession } from "telegram/sessions";

import "../fireabse/config";
import * as database from "../database";
import * as telegram from "../libs/telegram";

async function main() {
  if (process.env.MODE === "CONNECT") return connect();
  if (process.env.MODE === "JOIN") return join();
  throw new Error("MODE is required");
}

main().then(() => setTimeout(process.exit, 1000));

async function connect() {
  const filename = process.argv[2];
  if (!filename) throw new Error("filename is required");

  const appId = Number(process.argv[3]);
  if (!Number.isSafeInteger(appId)) throw new Error("app_id is required");

  const appHash = process.argv[4];
  if (!appHash) throw new Error("app_hash is required");

  const session = await database.session.connect(filename, appId, appHash);
  if (!session) throw new Error("unable to establish session");

  await database.session.save([session]);
  console.log(
    `SESSION.CONNECTED ${session.phone_number} -> ${session.id} -> ${session.username}`
  );
}

async function join() {
  const phone = process.argv[2];
  if (!phone) throw new Error("PHONE is required");

  const session = await database.session.get(phone);
  if (!session) throw new Error("session is not found");

  const object = process.argv[3];
  if (!object) throw new Error("channel or group is required");

  const client = await telegram.connect(
    new StringSession(session.session_key),
    session.app_id,
    session.app_hash
  );

  console.log(
    `SESSION.CONNECTED ${session.phone_number} -> ${session.id} -> ${session.username}`
  );

  const entity = await client.getEntity(object);
  const target = JSON.stringify(entity);
  if (entity.className.includes("Forbidden")) {
    console.log(`SESSION>ENTITY.FORBIDDEN ${session.phone_number} | ${target}`);
  } else {
    await database.session.join(session, target);
  }

  await client.disconnect();
}
