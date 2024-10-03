import "../fireabse/config";
import * as database from "../database";

async function main() {
  if (process.env.MODE === "CONNECT") return connect();
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
