import { SuperAdminSidebar } from '@/components/layout/super-admin-sidebar';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-auto bg-slate-950">{children}</main>
    </div>
  );
}
