'use client';
import { Search, ShoppingCart, User, LogOut } from "lucide-react";
import Link from "next/link"
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="w-full bg-primary text-white py-3 shadow-md">
      <div className="max-w-8xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <div className="w-32 md:w-40 h-8 md:h-10 flex items-center">
                <Image
                  src="/images/logomarca.png"
                  alt="Logomarca"
                  width={160}
                  height={40}
                  className="w-full h-full object-contain"
                />
            </div>
          </Link>
        </div>

        <ul className="hidden md:flex items-center gap-7 font-light text-sm">
          <Link className="hover:text-secondary cursor-pointer transition duration-500" href="/produtos">PRODUTOS</Link>
          <Link className="hover:text-secondary cursor-pointer transition duration-500" href="/about">SOBRE</Link>
          <Link className="hover:text-secondary cursor-pointer transition duration-500" href="/contact">CONTATO</Link>
          <Link className="hover:text-secondary cursor-pointer transition duration-500" href="/suporte">SUPORTE</Link>
          {session?.user?.role === 'admin' && (
            <Link className="hover:text-secondary cursor-pointer transition duration-500" href="/adm">ADMIN</Link>
          )}
        </ul>

        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/carrinho">
            <ShoppingCart className="w-5 h-5 cursor-pointer hover:text-secondary transition duration-500" />
          </Link>
          
          {session ? (
            <div className="flex items-center gap-2">
              <Link href="/perfil">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-500">
                  <User className="w-4 h-4 text-secondary" />
                </div>
              </Link>
              <button 
                onClick={() => signOut()}
                className="hover:text-secondary cursor-pointer transition duration-500"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
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