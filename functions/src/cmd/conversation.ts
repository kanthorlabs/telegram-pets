import "../fireabse/config";
import * as database from "../database";
import * as telegram from "../pets/telegram";

async function main() {
  if (process.env.MODE === "ASSIGN") return assign();
  if (process.env.MODE === "SEND") return send();
  throw new Error("MODE is required");
}

main().then(() => setTimeout(process.exit, 1000));

async function assign() {
  const phone = process.argv[2];
  if (!phone) throw new Error("PHONE is required");

  const session = await database.session.get(phone);
  if (!session) throw new Error("session is not found");

  console.log(
    `SESSION.CONNECTED ${session.phone_number} -> ${session.id} -> ${session.username}`
  );

  const replies = await database.reply.assign(session);
  console.log(`CONVERSTAION.ASSIGN ${replies.length} replices`);
}

async function send() {
  const phone = process.argv[2];
  if (!phone) throw new Error("PHONE is required");

  const session = await database.session.get(phone);
  if (!session) throw new Error("session is not found");

  const messages = await telegram.send(session);
  for (const message of messages) {
    console.log(message.replace("/", " -> "));
  }
  console.log(`CONVERSTAION.SEND ${messages.length} messages`);
}
