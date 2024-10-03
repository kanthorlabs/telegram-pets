import * as cheerio from "cheerio";
import "../fireabse/config";
import datasource from "../crawler/datasource";
import * as database from "../database";

async function main() {
  if (process.env.MODE === "THREADS") return threads();
  if (process.env.MODE === "REPLIES") return replices();
  throw new Error("MODE is required");
}

main().then(() => setTimeout(process.exit, 1000));

async function threads() {
  const domain = process.argv[2];
  if (!domain) throw new Error("domain is required");

  const ds = datasource[domain];
  if (!ds) throw new Error("domain not found");

  const pages = await ds.downloader.threads(10);
  for (let page of pages) {
    const threads = ds.parser.threads(cheerio.load(page));
    const docs = await database.thread.save(threads);
    console.log(`THREADS.CRAWLER.DOWNLOADER ${domain} > ${docs.length}`);
  }
}

async function replices() {
  const domain = process.argv[2];
  if (!domain) throw new Error("domain is required");

  const id = process.argv[3];
  if (!id) throw new Error("thread id is required");

  const ds = datasource[domain];
  if (!ds) throw new Error("domain not found");

  const thread = await database.thread.get(id);
  if (!thread) throw new Error(`thread [${id}] not found`);

  const pages = await ds.downloader.replices(thread, 1);
  for (let page of pages) {
    const replices = ds.parser.replices(cheerio.load(page), thread);
    const docs = await database.reply.save(replices);
    console.log(`REPLICES.CRAWLER.DOWNLOADER ${domain} > ${docs.length}`);
  }
}
