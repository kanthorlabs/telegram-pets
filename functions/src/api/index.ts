import express from "express";
import helmet from "helmet";
import cors from "cors";
import { json } from "body-parser";

export function use() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(json());

  app.get("/", (req, res) => {
    res.json({ now: new Date().toISOString() });
  });

  return app;
}
