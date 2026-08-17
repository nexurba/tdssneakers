import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminLogin from "./AdminLogin";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured, isAdminEmail } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseOn = isSupabaseConfigured();

  // When Supabase auth is configured, require a valid admin session.
  if (supabaseOn) {
    const user = await getCurrentUser();
    if (!user || !isAdminEmail(user.email)) {
      return <AdminLogin />;
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        {!supabaseOn && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800">
            Mode démo — authentification désactivée. Configurez Supabase (NEXT_PUBLIC_SUPABASE_URL) pour sécuriser l&apos;accès admin.
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
