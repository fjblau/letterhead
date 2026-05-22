import { pgTable, uuid, varchar, integer, boolean, timestamp, text, index } from "drizzle-orm/pg-core";

export const letterhead = pgTable(
  "letterhead",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 255 }).unique(),
    company_name: varchar("company_name", { length: 255 }).notNull(),
    company_division: varchar("company_division", { length: 255 }),
    city: varchar("city", { length: 255 }),
    country: varchar("country", { length: 2 }), // 2-char
    year_exact: integer("year_exact"),
    year_circa: integer("year_circa"),
    era: varchar("era", { length: 100 }),
    document_type: varchar("document_type", { length: 100 }), // enum/string represented as string
    language: varchar("language", { length: 2 }), // 2-char
    recipient: varchar("recipient", { length: 255 }),
    typewriter_models: text("typewriter_models").array(),
    design_notes: text("design_notes"),
    provenance: text("provenance"),
    source: text("source"),
    condition_notes: text("condition_notes"),
    tags: text("tags").array(),
    pdf_url: text("pdf_url"),
    pdf_size_bytes: integer("pdf_size_bytes"),
    pdf_page_count: integer("pdf_page_count"),
    thumb_url: text("thumb_url"),
    thumb_width: integer("thumb_width"),
    thumb_height: integer("thumb_height"),
    is_published: boolean("is_published").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    published_at: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [
    index("company_name_idx").on(table.company_name),
    index("era_idx").on(table.era),
    index("country_idx").on(table.country),
    index("document_type_idx").on(table.document_type),
    index("tags_gin_idx").using("gin", table.tags),
    index("typewriter_models_gin_idx").using("gin", table.typewriter_models),
  ]
);

export const letterheadEphemera = pgTable(
  "letterhead_ephemera",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    letterhead_id: uuid("letterhead_id")
      .notNull()
      .references(() => letterhead.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 100 }),
    mime_type: varchar("mime_type", { length: 100 }),
    file_url: text("file_url"),
    file_size_bytes: integer("file_size_bytes"),
    thumb_url: text("thumb_url"),
    width: integer("width"),
    height: integer("height"),
    page_count: integer("page_count"),
    role: varchar("role", { length: 100 }),
    caption: text("caption"),
    description: text("description"),
    sort_order: integer("sort_order").default(0).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("letterhead_id_sort_order_idx").on(table.letterhead_id, table.sort_order),
  ]
);
