import AdminNav from '@/components/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
