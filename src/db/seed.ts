import { db } from "./index";
import { letterhead, letterheadEphemera } from "./schema";
import { createCanvas } from "@napi-rs/canvas";
import { uploadBlob } from "../lib/storage";

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

async function generatePlaceholderImage(title: string, subtitle: string, bgColor: string): Promise<Buffer> {
  const canvas = createCanvas(600, 800);
  const ctx = canvas.getContext("2d");
  
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 600, 800);
  
  ctx.strokeStyle = "#DED4C7";
  ctx.lineWidth = 12;
  ctx.strokeRect(20, 25, 560, 750);
  
  ctx.strokeStyle = "#5C5045";
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 37, 536, 726);

  ctx.fillStyle = "#5C5045";
  ctx.font = "bold 32px serif";
  ctx.textAlign = "center";
  ctx.fillText("HISTORICAL SPECIMEN", 300, 150);

  ctx.beginPath();
  ctx.moveTo(100, 180);
  ctx.lineTo(500, 180);
  ctx.strokeStyle = "#5C5045";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#2C2621";
  ctx.font = "italic bold 36px serif";
  ctx.fillText(title, 300, 360);
  
  ctx.fillStyle = "#6E6155";
  ctx.font = "18px sans-serif";
  ctx.fillText(subtitle, 300, 420);

  ctx.fillStyle = "#8C7A6B";
  ctx.font = "italic 16px serif";
  ctx.fillText("Official Archive Registry", 300, 600);

  return await canvas.encode("webp", 85);
}

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    console.log("🧹 Clearing old data...");
    await db.delete(letterheadEphemera);
    await db.delete(letterhead);

    console.log("📝 Generating and uploading mock files...");

    const underwoodPdfUrl = await uploadBlob("underwood-1915/document.pdf", minPdfBuffer, "application/pdf");
    const underwoodThumbBuf = await generatePlaceholderImage("Underwood Typewriter Co.", "New York, US — 1915", "#FAF6ED");
    const underwoodThumbUrl = await uploadBlob("underwood-1915/thumb.webp", underwoodThumbBuf, "image/webp");

    const remingtonPdfUrl = await uploadBlob("remington-1928/document.pdf", minPdfBuffer, "application/pdf");
    const remingtonThumbBuf = await generatePlaceholderImage("Remington Typewriter Co.", "London, GB — 1928", "#FCFBF7");
    const remingtonThumbUrl = await uploadBlob("remington-1928/thumb.webp", remingtonThumbBuf, "image/webp");

    const underwoodEphemThumbBuf = await generatePlaceholderImage("Underwood Envelope", "Postmarked 1915", "#FAF8F5");
    const underwoodEphemUrl = await uploadBlob("underwood-1915/ephemera/envelope.webp", underwoodEphemThumbBuf, "image/webp");
    const underwoodEphemThumbUrl = await uploadBlob("underwood-1915/ephemera/envelope-thumb.webp", underwoodEphemThumbBuf, "image/webp");

    const remingtonEphemThumbBuf = await generatePlaceholderImage("Remington Leaflet", "User Instructions", "#F3ECE0");
    const remingtonEphemUrl = await uploadBlob("remington-1928/ephemera/leaflet.webp", remingtonEphemThumbBuf, "image/webp");
    const remingtonEphemThumbUrl = await uploadBlob("remington-1928/ephemera/leaflet-thumb.webp", remingtonEphemThumbBuf, "image/webp");

    console.log("📝 Inserting letterhead data...");

    const [underwood] = await db
      .insert(letterhead)
      .values({
        slug: "underwood-typewriter-1915",
        company_name: "Underwood Typewriter Co.",
        company_division: "Sales Department",
        city: "New York",
        country: "US",
        year_exact: 1915,
        era: "early-20th-century",
        document_type: "Business Letterhead",
        language: "EN",
        recipient: "Acme Manufacturing Corp.",
        typewriter_models: ["Underwood No. 5", "Underwood Standard"],
        design_notes: "Classic lithographed letterhead featuring the Underwood No. 5 machine at the top center. Fine ornate borders.",
        provenance: "Acquired from the estate of a New York history collector in 2021.",
        source: "Estate Sale",
        condition_notes: "Slight yellowing around edges, one minor fold line horizontally.",
        tags: ["lithograph", "vintage-machinery", "office-history"],
        pdf_url: underwoodPdfUrl,
        pdf_size_bytes: 1024560,
        pdf_page_count: 1,
        thumb_url: underwoodThumbUrl,
        thumb_width: 600,
        thumb_height: 800,
        is_published: true,
        published_at: new Date(),
      })
      .returning();

    const [remington] = await db
      .insert(letterhead)
      .values({
        slug: "remington-typewriter-1928",
        company_name: "Remington Typewriter Co.",
        company_division: "European Export Division",
        city: "London",
        country: "GB",
        year_exact: 1928,
        era: "interwar-period",
        document_type: "Invoice",
        language: "EN",
        recipient: "H.G. Wells",
        typewriter_models: ["Remington Portable", "Remington No. 12"],
        design_notes: "Elegant red and black typography, Art Deco styled header.",
        provenance: "Private collection in London.",
        source: "Antiquarian Book Fair",
        condition_notes: "Excellent condition.",
        tags: ["art-deco", "invoice", "british-history"],
        pdf_url: remingtonPdfUrl,
        pdf_size_bytes: 2048500,
        pdf_page_count: 2,
        thumb_url: remingtonThumbUrl,
        thumb_width: 620,
        thumb_height: 850,
        is_published: true,
        published_at: new Date(),
      })
      .returning();

    console.log("🎨 Inserting ephemera data...");

    await db.insert(letterheadEphemera).values([
      {
        letterhead_id: underwood.id,
        kind: "Envelope",
        mime_type: "image/jpeg",
        file_url: underwoodEphemUrl,
        file_size_bytes: 512000,
        thumb_url: underwoodEphemThumbUrl,
        width: 800,
        height: 450,
        page_count: 1,
        role: "Matching envelope",
        caption: "Original matching envelope postmarked October 12, 1915",
        description: "Hand-addressed envelope with an ornate Underwood logo on the top-left corner.",
        sort_order: 1,
      },
    ]);

    await db.insert(letterheadEphemera).values([
      {
        letterhead_id: remington.id,
        kind: "Instruction Leaflet",
        mime_type: "application/pdf",
        file_url: remingtonEphemUrl,
        file_size_bytes: 4096000,
        thumb_url: remingtonEphemThumbUrl,
        width: 500,
        height: 700,
        page_count: 4,
        role: "Reference material",
        caption: "Standard instruction leaflet for Remington Portable",
        description: "4-page printed user instructions folded inside the original invoice.",
        sort_order: 1,
      },
    ]);

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
