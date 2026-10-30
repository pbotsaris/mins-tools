import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const spaces = sqliteTable("spaces", { owner: text("owner").primaryKey(), revision: integer("revision").notNull().default(0), data: text("data").notNull() });
