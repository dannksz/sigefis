'use client';
import { Search, ShoppingCart, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="w-full bg-primary text-white py-3 shadow-md">
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
          <Link className="hover:text-secondary cursor-pointer transition duration-500" href="/login?callbackUrl=/adm/home">ADMIN</Link>
        </ul>

        <div className="flex items-center gap-2 md:gap-4">
          <Search className="w-5 h-5 cursor-pointer hover:text-secondary transition duration-500" />
          <ShoppingCart className="w-5 h-5 cursor-pointer hover:text-secondary transition duration-500" />
          
          <Link href="/login">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-500">
              <User className="w-4 h-4 text-secondary" />
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
