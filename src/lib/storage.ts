import { put, del, list } from "@vercel/blob";

export async function uploadBlob(pathname: string, body: any, contentType?: string): Promise<string> {
  if (process.env.MOCK_STORAGE === "true" || !process.env.BLOB_READ_WRITE_TOKEN) {
    return `https://mock-blob.vercel-storage.com/${pathname}`;
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
