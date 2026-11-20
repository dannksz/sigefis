'use client';
import { Search, ShoppingCart, User, LogOut, Settings, Package } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../../providers/AuthProvider";

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
  };

  return (
    <nav className="w-full bg-primary text-white py-3 shadow-md relative">
      <div className="max-w-8xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <div className="w-32 md:w-40 h-8 md:h-10 flex items-center">
              <div className="text-2xl font-bold">HALL OF JERSEYS</div>
            </div>
          </Link>
        </div>

        <ul className="hidden md:flex items-center gap-7 font-light text-sm">
          <Link className="hover:text-secondary cursor-pointer transition duration-500" href="/produtos">PRODUTOS</Link>
          <Link className="hover:text-secondary cursor-pointer transition duration-500" href="/about">SOBRE</Link>
          <Link className="hover:text-secondary cursor-pointer transition duration-500" href="/contact">CONTATO</Link>
          <Link className="hover:text-secondary cursor-pointer transition duration-500" href="/suporte">SUPORTE</Link>
          {isAdmin && (
            <Link className="hover:text-secondary cursor-pointer transition duration-500" href="/admin">ADMIN</Link>
          )}
        </ul>

        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/produtos">
            <Search className="w-5 h-5 cursor-pointer hover:text-secondary transition duration-500" />
          </Link>
          
          <Link href="/carrinho">
            <ShoppingCart className="w-5 h-5 cursor-pointer hover:text-secondary transition duration-500" />
          </Link>
          
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 hover:text-secondary transition duration-500"
              >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="hidden md:block text-sm">{user.nome}</span>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link
                    href="/perfil"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Meu Perfil
                  </Link>
                  <Link
                    href="/perfil/pedidos"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Meus Pedidos
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-500">
                <User className="w-4 h-4 text-secondary" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}