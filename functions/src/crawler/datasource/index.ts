import * as cheerio from "cheerio";
import { IThread } from "../../database/thread";
import { IReply } from "../../database/reply";
import * as vozvn from "./voz.vn";

export interface IParser {
  threads($: cheerio.CheerioAPI): IThread[];
  replices($: cheerio.CheerioAPI, thread: IThread): IReply[];
}

export interface IDownloader {
  threads(size: number): Promise<string[]>;
  replices(thread: IThread, size: number): Promise<string[]>;
}

export interface IDatasource {
  BASE: string;
  SEED_THREAD: string;
  parser: IParser;
  downloader: IDownloader;
}

export default {
  "voz.vn": vozvn,
} as { [key: string]: IDatasource };
