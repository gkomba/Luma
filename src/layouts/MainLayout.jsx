import { Link } from "react-router-dom";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-gray-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-4">LumaOS</h2>
        <nav className="flex flex-col gap-2">
          <Link to="/">Dashboard</Link>
          <Link to="/devices">Dispositivos</Link>
          <Link to="/settings">Configurações</Link>
        </nav>
      </aside>
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
