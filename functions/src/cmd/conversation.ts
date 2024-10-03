import "../fireabse/config";
import * as database from "../database";

async function main() {
  if (process.env.MODE === "SYNC") return sync();
  throw new Error("MODE is required");
}

main().then(() => setTimeout(process.exit, 1000));

async function sync() {
  const limit = Number(process.env.LIMIT) || 10;
  let cursor = 0;
  let count = 0;

  do {
    const converstaions: database.conversation.IConversation[] = [];

    const r = await database.thread.list(limit, cursor);
    cursor = r.cursor;
    count += r.docs.length;

    for (let i = 0; i < r.docs.length; i++) {
      const thread = r.docs[i];

      const replies = await database.reply.list(thread.id);
      const conversation: database.conversation.IConversation = {
        thread_id: thread.id,
        replies: replies.docs.map((d) => d.id),
        reply_cursor: 0,
        reply_available: replies.docs.length,
        updated_at: Date.now(),
      };
      console.log(
        `CONVERSATION.THREAD ${thread.id} -> ${conversation.replies.length}`
      );
      converstaions.push(conversation);
    }

    await database.conversation.save(converstaions);
    console.log(`CONVERSATION.SYNC ${count} -> ${cursor}`);
  } while (cursor > 0);
}
