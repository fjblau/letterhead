import { db } from "./index";
import { letterhead, letterheadEphemera } from "./schema";

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Clean existing data to ensure idempotency
    console.log("🧹 Clearing old data...");
    await db.delete(letterheadEphemera);
    await db.delete(letterhead);

    console.log("📝 Inserting letterhead data...");

    // Insert Underwood Letterhead
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
        pdf_url: "https://example.com/files/underwood-1915.pdf",
        pdf_size_bytes: 1024560,
        pdf_page_count: 1,
        thumb_url: "https://example.com/thumbs/underwood-1915-thumb.jpg",
        thumb_width: 600,
        thumb_height: 800,
        is_published: true,
        published_at: new Date(),
      })
      .returning();

    // Insert Remington Letterhead
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
        pdf_url: "https://example.com/files/remington-1928.pdf",
        pdf_size_bytes: 2048500,
        pdf_page_count: 2,
        thumb_url: "https://example.com/thumbs/remington-1928-thumb.jpg",
        thumb_width: 620,
        thumb_height: 850,
        is_published: true,
        published_at: new Date(),
      })
      .returning();

    console.log("🎨 Inserting ephemera data...");

    // Insert Underwood Ephemera
    await db.insert(letterheadEphemera).values([
      {
        letterhead_id: underwood.id,
        kind: "Envelope",
        mime_type: "image/jpeg",
        file_url: "https://example.com/files/underwood-1915-envelope.jpg",
        file_size_bytes: 512000,
        thumb_url: "https://example.com/thumbs/underwood-1915-envelope-thumb.jpg",
        width: 800,
        height: 450,
        page_count: 1,
        role: "Matching envelope",
        caption: "Original matching envelope postmarked October 12, 1915",
        description: "Hand-addressed envelope with an ornate Underwood logo on the top-left corner.",
        sort_order: 1,
      },
    ]);

    // Insert Remington Ephemera
    await db.insert(letterheadEphemera).values([
      {
        letterhead_id: remington.id,
        kind: "Instruction Leaflet",
        mime_type: "application/pdf",
        file_url: "https://example.com/files/remington-1928-instructions.pdf",
        file_size_bytes: 4096000,
        thumb_url: "https://example.com/thumbs/remington-1928-instructions-thumb.jpg",
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
