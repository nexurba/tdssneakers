import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminLogin from "./AdminLogin";
import { isAuthenticated, isAuthConfigured } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authOn = isAuthConfigured();

  if (authOn) {
    const authed = await isAuthenticated();
    if (!authed) {
      return <AdminLogin />;
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        {!authOn && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800">
            Mode démo — authentification désactivée. Définissez ADMIN_PASSWORD dans les variables d&apos;environnement pour sécuriser l&apos;accès admin.
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
