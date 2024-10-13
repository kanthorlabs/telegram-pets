import admin from "firebase-admin";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { json } from "body-parser";
import * as utils from "../utils";
import * as pethandler from "../pets/handler";
import * as database from "../database";
import * as threads from "../crawler/threads";
import * as replies from "../crawler/replies";
import datasource from "../crawler/datasource";

export function use() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(json());

  app.get("/", (req, res) => {
    res.json({ now: new Date().toISOString() });
  });

  app.get("/ip", async (req, res) => {
    res.json({ ip: await utils.ip() });
  });

  app.get("/pets/simple", async (req, res) => {
    const result: any = {};
    result.docs = await pethandler.simple("api");
    if (result.docs.length === 0) {
      result.incomming = await admin
        .firestore()
        .collection(database.session.COLLECTION)
        .orderBy("lock_expired_at", "asc")
        .limit(1)
        .get()
        .then(async (s) => ({ ...s.docs[0].data() }))
        .then((x) =>
          Number.isSafeInteger(x.lock_expired_at)
            ? new Date(x.lock_expired_at).toISOString()
            : null
        );
    }
    res.json(result);
  });

  app.get("/crawler/thread", async (req, res): Promise<any> => {
    const domain = req.query.domain as string;
    if (!domain) {
      return res.status(400).json({ error: "domain is required" });
    }

    const docs = await threads.exec(datasource[domain]);
    return res.json({ docs });
  });

  app.get("/crawler/reply", async (req, res): Promise<any> => {
    const domain = req.query.domain as string;
    if (!domain) {
      return res.status(400).json({ error: "domain is required" });
    }

    const threads: database.thread.IThread[] = [];

    const id = req.query.id as string;
    const limit = Number(req.query.limit || 10);
    if (id) {
      const thread = await database.thread.get(id);
      if (!thread) throw new Error(`thread [${id}] not found`);
      threads.push(thread);
    } else {
      const list = await database.thread.list(limit, 0);
      threads.push(...list.docs);
    }

    const docs = await replies.exec(datasource[domain], threads);
    return res.json({ docs });
  });

  return app;
}
