import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { config } from "../../../lib/config.js";
import type { CatalogSnapshot } from "./catalog-snapshot.js";

export class CatalogFileRepository {
  public constructor(private readonly baseDir = config.catalogStorageDir) {}

  public async saveSnapshot(snapshot: CatalogSnapshot, fileName = "bootstrap.json"): Promise<string> {
    const sourceDirectory = path.resolve(this.baseDir, snapshot.source);

    await mkdir(sourceDirectory, { recursive: true });

    const outputPath = path.join(sourceDirectory, fileName);

    await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

    return outputPath;
  }
}
