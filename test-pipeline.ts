import { processPdf } from "./src/lib/pdf";
import { processEphemeraFile } from "./src/lib/ephemera";
import { createCanvas } from "@napi-rs/canvas";

const minPdfBuffer = Buffer.from(
  "%PDF-1.4\n" +
  "1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj\n" +
  "2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj\n" +
  "3 0 obj <</Type/Page/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/MediaBox[0 0 595 842]/Contents 5 0 R>> endobj\n" +
  "4 0 obj <</Type/Font/Subtype/Type1/BaseFont/Helvetica>> endobj\n" +
  "5 0 obj <</Length 44>> stream\n" +
  "BT /F1 12 Tf 72 712 Td (Hello World) Tj ET\n" +
  "endstream\n" +
  "endobj\n" +
  "xref\n" +
  "0 6\n" +
  "0000000000 65535 f \n" +
  "0000000009 00000 n \n" +
  "0000000053 00000 n \n" +
  "0000000100 00000 n \n" +
  "0000000213 00000 n \n" +
  "0000000282 00000 n \n" +
  "trailer <</Size 6/Root 1 0 R>>\n" +
  "startxref\n" +
  "375\n" +
  "%%EOF"
);

async function run() {
  console.log("Running local pipeline tests...");

  process.env.MOCK_STORAGE = "true";

  try {
    console.log("\n1. Testing processPdf...");
    const pdfRes = await processPdf(minPdfBuffer);
    console.log("SUCCESS:", {
      pageCount: pdfRes.pageCount,
      thumbBufferSize: pdfRes.thumbBuffer.length,
      dimensions: `${pdfRes.width}x${pdfRes.height}`,
    });
  } catch (e: any) {
    console.error("FAILED processPdf:", e);
  }

  try {
    console.log("\n2. Testing Image Ephemera...");
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, 200, 200);
    const imgBuffer = await canvas.encode("png");

    const imgRes = await processEphemeraFile("test-lh", "test-img", imgBuffer, "test.png", "image/png");
    console.log("SUCCESS:", imgRes);
  } catch (e: any) {
    console.error("FAILED Image Ephemera:", e);
  }

  try {
    console.log("\n3. Testing Audio Ephemera...");
    const audioBuffer = Buffer.alloc(100);
    const audioRes = await processEphemeraFile("test-lh", "test-aud", audioBuffer, "test.mp3", "audio/mpeg");
    console.log("SUCCESS:", audioRes);
  } catch (e: any) {
    console.error("FAILED Audio Ephemera:", e);
  }

  console.log("\nAll tests run completed.");
}

run().catch(console.error);
