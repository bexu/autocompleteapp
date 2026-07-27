import { Brand } from "@/components/Brand";

// Shell comun pentru zona autentificată: bară subțire, sticky, cu marca.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <Brand href="/dashboard" />
          <span className="header-meta">Generează, verifică, depune</span>
        </div>
      </header>
      {children}
    </>
  );
}
