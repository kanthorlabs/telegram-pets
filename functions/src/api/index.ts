import express from "express";
import helmet from "helmet";
import cors from "cors";
import { json } from "body-parser";
import * as utils from "../utils";
import * as pethandler from "../pets/handler";

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
    res.json({ messages: await pethandler.simple("api") });
  });

  return app;
}
