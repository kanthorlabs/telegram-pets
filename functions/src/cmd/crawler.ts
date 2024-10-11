import "../fireabse/config";
import datasource from "../crawler/datasource";
import * as threads from "../crawler/threads";
import * as replies from "../crawler/replies";
import * as database from "../database";

async function main() {
  if (process.env.MODE === "THREADS") return getThreads();
  if (process.env.MODE === "REPLIES") return getReplices();
  throw new Error("MODE is required");
}

main().then(() => setTimeout(process.exit, 1000));

async function getThreads() {
  const domain = process.argv[2];
  if (!domain) throw new Error("domain is required");

  const ds = datasource[domain];
  if (!ds) throw new Error("domain not found");

  const docs = await threads.exec(ds);
  console.log(`CRAWLER.THREADS ${domain} > ${docs.length}`);
}

async function getReplices() {
  const domain = process.argv[2];
  if (!domain) throw new Error("domain is required");

  const ds = datasource[domain];
  if (!ds) throw new Error("domain not found");

  const threads: database.thread.IThread[] = [];

  const id = process.argv[3];
  const limit = Number(process.argv[4]) || 10;
  if (id) {
    const thread = await database.thread.get(id);
    if (!thread) throw new Error(`thread [${id}] not found`);
    threads.push(thread);
  } else {
    const list = await database.thread.list(limit, 0);
    threads.push(...list.docs);
  }

  const docs = await replies.exec(ds, threads);
  console.log(`CRAWLER.REPLIES ${domain} > ${docs.length}`);
}
