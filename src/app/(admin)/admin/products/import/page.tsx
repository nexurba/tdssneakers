import type { Metadata } from "next";
import { isDbConfigured } from "@/db";
import { isBlobConfigured } from "@/lib/storage/blob";
import BulkImport from "./BulkImport";

export const metadata: Metadata = {
  title: "Import en masse",
};

export default function ImportPage() {
  return (
    <BulkImport
      dbConfigured={isDbConfigured}
      // Decides whether images go browser-to-Blob (required on Vercel, where a
      // function request body is capped at 4.5 MB) or through the Server Action
      // fallback that writes to disk in development.
      blobAvailable={isBlobConfigured()}
    />
  );
}
