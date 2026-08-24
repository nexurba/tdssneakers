import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth/admin";
import { buildTemplateWorkbook } from "@/lib/catalog/import-template";

/**
 * Serves the .xlsx import template.
 *
 * Route handlers do not run the admin layout, so the session check that guards
 * every /admin page does not apply here. This endpoint has to verify the
 * session itself.
 */
export async function GET() {
  if (!(await isAuthenticated())) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  try {
    const buffer = await buildTemplateWorkbook();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="tdssneakers-modele-import.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new NextResponse(
      `Génération du modèle impossible : ${(err as Error).message}`,
      { status: 500 }
    );
  }
}
