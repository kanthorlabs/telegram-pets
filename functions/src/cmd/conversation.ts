import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import random from "lodash.random";

import "../fireabse/config";
import * as database from "../database";
import * as telegram from "../libs/telegram";

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

  console.log(
    `SESSION.CONNECTED ${session.phone_number} -> ${session.id} -> ${session.username}`
  );

  const replies = await database.reply.send(session);
  console.log(`CONVERSTAION.RECEIVED ${replies.length} replices`);

  const client = await telegram.connect(
    new StringSession(session.session_key),
    session.app_id,
    session.app_hash
  );

  const sample = 30;

  const targets = session.targets.map((target) => JSON.parse(target));
  let tcur = 0;
  for (let reply of replies) {
    const target = targets[tcur];
    tcur = (tcur + 1) % targets.length;

    if (target.className === "Chat") {
      const entity = new Api.InputPeerChat({ chatId: target.id });
      const r = await client
        .sendMessage(entity, { message: reply.content })
        .catch((err) => {
          console.log(`CONVERSATION.SEND.ERROR ${target.id} | ${err}`);
          return null;
        });
      if (r) console.log(`CONVERSATION.SEND.OK ${target.id} | ${r.id}`);
    } else {
      console.log(
        `CONVERSATION.SEND.ERROR ${target.id} | ${target.className} is unsupported`
      );
      continue;
    }

    const wait = random(Math.floor((sample * 2) / 3), sample) * 1000;
    await new Promise((resolve) => setTimeout(resolve, wait));
  }

  await client.disconnect();
}
