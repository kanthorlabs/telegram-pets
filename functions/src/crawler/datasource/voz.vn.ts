import path from "path";
import * as logger from "firebase-functions/logger";
import * as cheerio from "cheerio";
import * as database from "../../database";
import { hr2int, text2hex } from "../../utils";

export const BASE = "https://voz.vn";
export const SEED_THREAD = "https://voz.vn/f/chuyen-tro-linh-tinh.17/page-";

export const parser = {
  threads($: cheerio.CheerioAPI): database.thread.IThread[] {
    const threads: database.thread.IThread[] = [];

    const items = Array.from(
      $(".structItemContainer-group.js-threadList > .structItem")
    );
    for (let item of items) {
      const select = cheerio.load(item);

      const url =
        select(".structItem-cell--main .structItem-title > a").attr("href") ||
        "";
      const thread: database.thread.IThread = {
        id: text2hex(url),
        url: url ? new URL(url, BASE).toString() : "",
        title: select(".structItem-cell--main  .structItem-title > a").text(),
        author_username: select(".structItem-cell--main .username").text(),
        statstics_replies: hr2int(
          select(".structItem-cell--meta").first().text()
        ),
        statstics_views: hr2int(
          select(".structItem-cell--meta .structItem-minor").text()
        ),
        updated_at: Date.now(),
        crawler_page_cur: 1,
        crawler_page_max: 1,
      };
      thread.crawler_page_max = Math.round(thread.statstics_replies / 20);

      if (database.thread.validate(thread)) threads.push(thread);
    }

    return threads;
  },

  replices(
    $: cheerio.CheerioAPI,
    thread: database.thread.IThread
  ): database.reply.IReply[] {
    const replices: database.reply.IReply[] = [];

    const items = Array.from($("article.message.message--post"));
    for (let item of items) {
      const select = cheerio.load(item);

      const reply: database.reply.IReply = {
        thread_id: thread.id,
        id: "",
        url: "",
        content: select(".message-body .bbWrapper")
          .text()
          .replace(/\n/g, " ")
          .replace(/\t/g, " "),
        author_username:
          item.attributes.find((attr) => attr.name === "data-author")?.value ||
          "",
        updated_at: Date.now(),
        sender_session_phone_number: "",
        sender_sent_at: 0,
      };
      while (reply.content.includes("  ")) {
        reply.content = reply.content.replace(/  /g, " ").trim();
      }
      reply.content = reply.content.slice(
        reply.content.length - 256,
        reply.content.length
      );

      const replyId =
        item.attributes.find((attr) => attr.name === "data-content")?.value ||
        "";
      if (replyId) {
        const url = new URL(thread.url, BASE);
        url.pathname = path.join(url.pathname, replyId);

        reply.url = url.toString();
        reply.id = text2hex(reply.url);
      }

      if (database.reply.validate(reply)) replices.push(reply);
    }

    return replices;
  },
};

export const downloader = {
  async threads(size = 3): Promise<string[]> {
    const pages: string[] = [];

    for (let i = 0; i < size; i++) {
      const res = await fetch(SEED_THREAD + String(i + 1));
      if (!res.ok) {
        logger.error(`CRAWLER.DOWNLOADER VOZ.VN ${i + 1} ${res.status} `);
        return pages;
      }

      const html = await res.text();
      pages.push(html);
    }

    return pages;
  },

  async replices(thread: database.thread.IThread, size = 1): Promise<string[]> {
    const pages: string[] = [];

    for (let i = 0; i < size; i++) {
      const url = new URL(thread.url, BASE);
      url.pathname = path.join(
        url.pathname,
        "/page-" + String(Number(thread.crawler_page_cur) + i)
      );

      const res = await fetch(url.toString());
      if (!res.ok) {
        logger.error(`CRAWLER.DOWNLOADER VOZ.VN ${thread.url} ${res.status} `);
        return pages;
      }

      const html = await res.text();
      pages.push(html);
    }

    return pages;
  },
};
