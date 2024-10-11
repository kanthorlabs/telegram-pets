import * as logger from "firebase-functions/logger";
import * as cheerio from "cheerio";

import datasource, { IDatasource } from "./datasource";
import * as database from "../database";

export async function run() {
  for (let domain in datasource) {
    logger.info(`CRAWLER.THREADS ${domain} ...`);

    const docs = await exec(datasource[domain]);
    logger.info(`CRAWLER.THREADS ${domain} > ${docs.length}`);
  }
}

export async function exec(ds: IDatasource) {
  const docs: database.thread.IThread[] = [];

  const pages = await ds.downloader.threads(10);
  for (let page of pages) {
    const threads = ds.parser.threads(cheerio.load(page));
    const items = await database.thread.save(threads);
    docs.push(...items);
  }

  return docs;
}
