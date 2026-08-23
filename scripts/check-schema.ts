import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  const cols = await sql`
    select column_name, data_type, is_nullable
    from information_schema.columns
    where table_name = 'products'
      and column_name in ('gender','brand','product_code','color_hex')
    order by column_name`;
  console.log("new columns:", cols.map((c) => `${c.column_name}(${c.is_nullable})`).join(", "));

  const cats = await sql`select unnest(enum_range(null::product_category))::text as v`;
  console.log("categories:", cats.map((r) => r.v).join(", "));

  const genders = await sql`select unnest(enum_range(null::product_gender))::text as v`;
  console.log("genders:", genders.map((r) => r.v).join(", "));

  await sql.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
