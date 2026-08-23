import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  const rows = await sql`
    select id, name, category, gender from products
    where name in ('Guard Acc','Guard Test','TEST Shoe','TEST Cap','TEST Sneaker')`;
  console.log("test rows found:", rows.length, rows.map((r) => `${r.name}[${r.category}/${r.gender ?? "null"}]`).join(", "));
  const del = await sql`
    delete from products
    where name in ('Guard Acc','Guard Test','TEST Shoe','TEST Cap','TEST Sneaker')
    returning id`;
  console.log("deleted:", del.length);
  const total = await sql`select count(*)::int as n from products`;
  console.log("remaining products:", total[0].n);
  await sql.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
