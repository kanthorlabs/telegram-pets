import * as logger from "firebase-functions/logger";
import * as cheerio from "cheerio";

import datasource, { IDatasource } from "./datasource";
import * as database from "../database";

export async function run(limit = 10) {
  for (let domain in datasource) {
    logger.info(`CRAWLER.REPLIES ${domain} ...`);

    const { docs: threads } = await database.thread.list(limit, 0);
    const docs = await exec(datasource[domain], threads);
    logger.info(`CRAWLER.REPLIES ${domain} > ${docs.length}`);
  }
}

export async function exec(
  ds: IDatasource,
  threads: database.thread.IThread[],
  p = 1,
  wait = 1
) {
  const docs: database.reply.IReply[] = [];

  for (let thread of threads) {
    const pages = await ds.downloader.replices(thread, p);
    await new Promise((resolve) => setTimeout(resolve, wait * 1000));
    for (let page of pages) {
      const replices = ds.parser.replices(cheerio.load(page), thread);
      const items = await database.reply.save(replices);
      docs.push(...items);
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
    }
  }

  return docs;
}
