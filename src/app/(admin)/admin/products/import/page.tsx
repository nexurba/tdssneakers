import type { Metadata } from "next";
import { isDbConfigured } from "@/db";
import BulkImport from "./BulkImport";

export const metadata: Metadata = {
  title: "Import en masse",
};

export default function ImportPage() {
  return <BulkImport dbConfigured={isDbConfigured} />;
}
