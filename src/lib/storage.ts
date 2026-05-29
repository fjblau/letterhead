import { put, del, list } from "@vercel/blob";
import * as fs from "fs";
import * as path from "path";

export async function uploadBlob(pathname: string, body: any, contentType?: string): Promise<string> {
  if (process.env.MOCK_STORAGE === "true" || !process.env.BLOB_READ_WRITE_TOKEN) {
    const localPath = path.join(process.cwd(), "public", "mock-blob", pathname);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, body);
    return `/mock-blob/${pathname}`;
  }
  const options: any = {
    access: "public",
    addRandomSuffix: false,
  };
  if (contentType) {
    options.contentType = contentType;
  }
  const blob = await put(pathname, body, options);
  return blob.url;
}

export async function deleteFolder(prefix: string): Promise<void> {
  if (process.env.MOCK_STORAGE === "true" || !process.env.BLOB_READ_WRITE_TOKEN) {
    const localDirPath = path.join(process.cwd(), "public", "mock-blob", prefix);
    if (fs.existsSync(localDirPath)) {
      fs.rmSync(localDirPath, { recursive: true, force: true });
    }
    return;
  }
  let hasMore = true;
  let cursor: string | undefined;
  while (hasMore) {
    const response = await list({
      prefix,
      cursor,
    });
    if (response.blobs.length > 0) {
      await del(response.blobs.map((b) => b.url));
    }
    hasMore = response.hasMore;
    cursor = response.cursor;
  }
}
