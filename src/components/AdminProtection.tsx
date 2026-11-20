'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type AdminProtectionProps = {
  children: React.ReactNode;
};

export default function AdminProtection({ children }: AdminProtectionProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return; // Ainda carregando

    if (status === 'unauthenticated' || !session) {
      router.push('/login');
      return;
    }

    const userRole = session.user?.role?.toUpperCase();
    if (userRole !== 'ADMIN') {
      router.push('/');
      return;
    }

    setIsLoading(false);
  }, [session, status, router]);

  // Mostrar loading enquanto verifica autenticação
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se chegou até aqui, é admin autenticado
  return <>{children}</>;
}