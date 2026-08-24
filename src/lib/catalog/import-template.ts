import "server-only";
import ExcelJS from "exceljs";
import { COLUMNS } from "./product-import";
import {
  CATEGORIES,
  GENDERS,
  POPULAR_COLORS,
  getSizeOptions,
  sizeChartLabel,
  ONE_SIZE,
  type ProductCategory,
  type ProductGender,
} from "./taxonomy";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF111827" },
};

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  row.fill = HEADER_FILL;
  row.alignment = { vertical: "middle" };
  row.height = 22;
}

/** Example rows covering the three categories and the unisex conversion. */
const EXAMPLES: Record<string, string>[] = [
  {
    name: "Nike Dunk Low",
    productCode: "DD1391-100",
    price: "129.99",
    category: "sneakers",
    gender: "homme",
    color: "Blanc",
    colorHex: "#FFFFFF",
    brand: "Nike",
    description: "Silhouette basse iconique en cuir.",
    sizes: "8,9,10,11",
    stock: "8:3,9:5,10:2,11:1",
    sizeScale: "",
    isNew: "oui",
    isBestSeller: "non",
    isActive: "oui",
  },
  {
    name: "Hoodie TDS Classic",
    productCode: "TDS-HOOD-01",
    price: "89.00",
    category: "vetements",
    gender: "unisex",
    color: "Noir",
    colorHex: "#000000",
    brand: "TDSSNEAKERS",
    description: "Molleton épais, coupe unisexe.",
    sizes: "S,M,L,XL",
    stock: "4",
    sizeScale: "men",
    isNew: "non",
    isBestSeller: "oui",
    isActive: "oui",
  },
  {
    name: "Casquette TDS",
    productCode: "TDS-CAP-01",
    price: "35.00",
    category: "accessoires",
    gender: "",
    color: "Noir",
    colorHex: "#000000",
    brand: "TDSSNEAKERS",
    description: "Casquette 6 panneaux, logo brodé.",
    sizes: "",
    stock: "12",
    sizeScale: "",
    isNew: "non",
    isBestSeller: "non",
    isActive: "oui",
  },
];

function addProductsSheet(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("Produits", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: Math.max(c.header.length + 4, c.key === "description" ? 42 : 16),
  }));
  styleHeader(ws.getRow(1));

  for (const example of EXAMPLES) {
    ws.addRow(example);
  }

  // Mark the example block so it is obvious these rows should be replaced.
  for (let i = 2; i <= 1 + EXAMPLES.length; i++) {
    ws.getRow(i).font = { italic: true, color: { argb: "FF6B7280" } };
  }

  const note = ws.addRow({});
  note.getCell(1).value =
    "↑ Remplacez les 3 lignes d'exemple ci-dessus par vos produits. Une ligne = un produit.";
  note.font = { bold: true, color: { argb: "FFB45309" } };

  return ws;
}

function addHelpSheet(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("Colonnes");
  ws.columns = [
    { header: "colonne", key: "header", width: 20 },
    { header: "obligatoire", key: "req", width: 16 },
    { header: "description", key: "help", width: 78 },
    { header: "exemple", key: "example", width: 30 },
  ];
  styleHeader(ws.getRow(1));

  const label: Record<string, string> = {
    required: "obligatoire",
    conditional: "selon catégorie",
    optional: "optionnel",
  };

  for (const c of COLUMNS) {
    const row = ws.addRow({
      header: c.header,
      req: label[c.requirement],
      help: c.help,
      example: c.example,
    });
    if (c.requirement === "required") {
      row.getCell(2).font = { bold: true, color: { argb: "FFB91C1C" } };
    }
    row.alignment = { vertical: "top", wrapText: true };
  }

  ws.addRow({});
  const imgTitle = ws.addRow({ header: "IMAGES" });
  imgTitle.font = { bold: true };
  for (const line of [
    "Nommez chaque fichier d'après le nom du produit ou son code produit, suivi de _1, _2, _3…",
    "Exemples : « Nike Dunk Low_1.jpg », « nike-dunk-low_2.png », « DD1391-100_1.jpeg ».",
    "_1 devient l'image principale. Les accents, espaces, tirets et majuscules sont ignorés.",
    "Formats acceptés : jpg, jpeg, png, webp, avif. Taille maximale : 8 Mo par image.",
    "Les images sont déposées séparément dans l'écran d'import, après le fichier Excel.",
  ]) {
    ws.addRow({ help: line }).alignment = { vertical: "top", wrapText: true };
  }

  return ws;
}

function addValuesSheet(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet("Valeurs acceptées");
  ws.columns = [
    { header: "champ", key: "field", width: 24 },
    { header: "contexte", key: "context", width: 30 },
    { header: "valeurs", key: "values", width: 88 },
  ];
  styleHeader(ws.getRow(1));

  ws.addRow({
    field: "categorie",
    context: "toutes",
    values: CATEGORIES.map((c) => `${c.value} (${c.label})`).join("  ·  "),
  });
  ws.addRow({
    field: "genre",
    context: "sneakers, vetements",
    values: GENDERS.map((g) => `${g.value} (${g.label})`).join("  ·  "),
  });
  ws.addRow({
    field: "genre",
    context: "accessoires",
    values: "laisser vide — les accessoires n'ont pas de genre",
  });
  ws.addRow({
    field: "tailles",
    context: "accessoires",
    values: `laisser vide — une taille unique « ${ONE_SIZE} » est créée automatiquement`,
  });
  ws.addRow({
    field: "echelle_tailles",
    context: "genre = unisex",
    values:
      "men ou women — indique dans quelle échelle vous avez saisi les tailles. " +
      "Le stockage se fait toujours en échelle homme, la conversion est automatique.",
  });

  ws.addRow({});
  const chartTitle = ws.addRow({ field: "TAILLES SUGGÉRÉES" });
  chartTitle.font = { bold: true };

  const cats: ProductCategory[] = ["sneakers", "vetements"];
  const genders: ProductGender[] = ["homme", "femme", "enfant", "unisex"];
  for (const cat of cats) {
    for (const gender of genders) {
      const sizes = getSizeOptions(cat, gender);
      if (sizes.length === 0) continue;
      ws.addRow({
        field: cat,
        context: `${gender} — ${sizeChartLabel(cat, gender)}`,
        values: sizes.join(", "),
      });
    }
  }

  ws.addRow({});
  const colorTitle = ws.addRow({ field: "COULEURS COURANTES" });
  colorTitle.font = { bold: true };
  ws.addRow({
    field: "couleur",
    context: "noms suggérés",
    values: POPULAR_COLORS.map((c) => c.name).join(", "),
  });
  ws.addRow({
    field: "couleur",
    context: "personnalisée",
    values:
      "N'importe quel nom est accepté. Ajoutez couleur_hex (#RRGGBB) pour la pastille affichée en boutique.",
  });

  ws.eachRow((row, n) => {
    if (n > 1) row.alignment = { vertical: "top", wrapText: true };
  });

  return ws;
}

/** Builds the .xlsx import template as a buffer. */
export async function buildTemplateWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "TDSSNEAKERS";
  wb.created = new Date();

  addProductsSheet(wb);
  addHelpSheet(wb);
  addValuesSheet(wb);

  const data = await wb.xlsx.writeBuffer();
  return Buffer.from(data);
}
