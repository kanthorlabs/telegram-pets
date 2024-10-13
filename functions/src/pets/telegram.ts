import * as logger from "firebase-functions/logger";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import random from "lodash.random";

import * as database from "../database";
import * as telegram from "../libs/telegram";

export async function send(
  session: database.session.ISession,
  interval = 30,
  max = 10
) {
  const log = `[${session.phone_number}] PETS.TELEGRAM.SEND`;
  const messages: string[] = [];

  const client = await telegram
    .connect(
      new StringSession(session.session_key),
      session.app_id,
      session.app_hash
    )
    .catch((err) => {
      logger.error(
        `${log} | ${JSON.stringify(session)} | ERROR ${err.message}`
      );
      return null;
    });
  if (!client) return messages;

  const limit = random(2, max, false);
  const replies = await database.reply.assign(session, limit);
  const targets = session.targets.map((target) => JSON.parse(target));

  let destination = 0;
  for (let reply of replies) {
    const target = targets[destination];
    // move to next target
    destination = (destination + 1) % targets.length;

    const msglen = random(127, 255, false);
    const message = reply.content.slice(0, msglen);

    try {
      if (target.className === "Chat") {
        const entity = new Api.InputPeerChat({ chatId: target.id });
        const r = await client.sendMessage(entity, { message }).catch((err) => {
          console.log(
            `${log} | ${JSON.stringify(session)} | ${target.id} | ${err}`
          );
          return null;
        });
        if (r) console.log(`${log} | ${target.id} | ${r.id}`);
      } else {
        console.log(
          `${log} | ${JSON.stringify(session)} | ${target.id} | ${
            target.className
          } is unsupported`
        );
        continue;
      }

      messages.push(`${session.phone_number}/${target.id}/${reply.id}`);
      logger.info(`${log} | SEND ${reply.id} -> ${target.id}`);
    } catch (err: any) {
      logger.error(
        `${log} | ${JSON.stringify(session)} | ERROR ${err.message}`
      );
    } finally {
      const wait =
        random(Math.floor((interval * 2) / 3), interval, false) * 1000;
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }

  await client.disconnect();
  return messages;
}
