import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { Database } from "sqlite/build/Database";
import { AuthKey } from "telegram/crypto/AuthKey";
import { Session, StringSession } from "telegram/sessions";
import { TelegramClient } from "telegram";

const EXTENSION = ".session";

export class SQLiteSession extends StringSession {
  private _conn?: Database;
  private fileName: string;

  constructor(sessionPath: string, extension = EXTENSION) {
    super();
    sqlite3.verbose();

    this.fileName = ":memory:";
    if (sessionPath) {
      this.fileName =
        path.extname(sessionPath) === extension
          ? sessionPath
          : sessionPath + extension;
    }
  }

  async load() {
    this._conn = await open({
      filename: this.fileName,
      driver: sqlite3.Database,
    });
    const session = await this._conn.get("select * from sessions");

    let authKey = session?.auth_key;
    if (authKey && typeof authKey === "object") {
      this._authKey = new AuthKey();
      if ("data" in authKey) {
        authKey = Buffer.from(authKey.data);
      }
      await this._authKey.setKey(authKey);
    }

    const dcId = session?.dc_id;
    if (dcId) {
      this._dcId = dcId;
    }

    const port = session?.port;
    if (port) {
      this._port = port;
    }
    const serverAddress = session?.server_address;
    if (serverAddress) {
      this._serverAddress = serverAddress;
    }
  }
}

export async function connect(
  session: Session,
  appId: number,
  appHash: string
) {
  const client = new TelegramClient(session, appId, appHash, {
    connectionRetries: 5,
  });
  await client.connect();

  return client;
}
