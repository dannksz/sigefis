"use client";

import { useState, useEffect } from 'react';
import { useCookies, useUserPreferences, useCartCookies } from '@/hooks/useCookies';
import { notifications } from '@/components/Toast/notifications';

export default function CookieExample() {
  const { setCookie, getCookie, removeCookie, getAllCookies } = useCookies();
  const { setTheme, getTheme, setLanguage, getLanguage } = useUserPreferences();
  const { saveCart, getCart, clearCart } = useCartCookies();
  
  const [cookieValue, setCookieValue] = useState('');
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    // Carrega as preferências salvas
    const savedTheme = getTheme();
    setCurrentTheme(savedTheme);
    
    // Carrega carrinho
    const savedCart = getCart();
    setCartItems(savedCart);
    
    // Carrega um cookie personalizado
    const customValue = getCookie('example-cookie');
    setCookieValue(customValue || '');
  }, []);

  const handleSetCookie = () => {
    setCookie('example-cookie', cookieValue, { expires: 1 }); // 1 dia
    notifications.cookieSet();
  };

  const handleGetCookie = () => {
    const value = getCookie('example-cookie');
    notifications.info(`Valor do cookie: ${value || 'Não encontrado'}`);
  };

  const handleRemoveCookie = () => {
    removeCookie('example-cookie');
    setCookieValue('');
    notifications.cookieRemoved();
  };

  const handleSetTheme = (theme: 'light' | 'dark') => {
    setTheme(theme);
    setCurrentTheme(theme);
    notifications.themeSaved(theme);
  };

  const handleSetLanguage = () => {
    setLanguage('pt-BR');
    notifications.languageSaved();
  };

  const handleAddToCart = () => {
    const newItem = {
      id: Date.now(),
      name: `Produto ${Date.now()}`,
      price: 99.99,
      quantity: 1
    };
    
    const updatedCart = [...cartItems, newItem];
    setCartItems(updatedCart);
    saveCart(updatedCart);
    notifications.success('Item adicionado ao carrinho!');
  };

  const handleClearCart = () => {
    clearCart();
    setCartItems([]);
    notifications.cartCleared();
  };

  const showAllCookies = () => {
    const all = getAllCookies();
    console.log('Todos os cookies:', all);
    notifications.info('Veja o console para todos os cookies');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center">Exemplo de Cookies</h1>
      
      {/* Cookie Personalizado */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Cookie Personalizado</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Valor do cookie"
            value={cookieValue}
            onChange={(e) => setCookieValue(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSetCookie}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Definir Cookie
            </button>
            <button
              onClick={handleGetCookie}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Ler Cookie
            </button>
            <button
              onClick={handleRemoveCookie}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Remover Cookie
            </button>
          </div>
        </div>
      </div>

      {/* Preferências do Usuário */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Preferências do Usuário</h2>
        <div className="space-y-4">
          <div>
            <p className="mb-2">Tema atual: <strong>{currentTheme || 'Não definido'}</strong></p>
            <div className="flex gap-2">
              <button
                onClick={() => handleSetTheme('light')}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
              >
                Tema Claro
              </button>
              <button
                onClick={() => handleSetTheme('dark')}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900"
              >
                Tema Escuro
              </button>
              <button
                onClick={handleSetLanguage}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
              >
                Definir Idioma (PT-BR)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Carrinho de Compras */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Carrinho de Compras</h2>
        <div className="space-y-4">
          <p>Itens no carrinho: <strong>{cartItems.length}</strong></p>
          {cartItems.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2">
                  <span>{item.name}</span>
                  <span>R$ {item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Adicionar Item
            </button>
            <button
              onClick={handleClearCart}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Limpar Carrinho
            </button>
          </div>
        </div>
      </div>

      {/* Utilitários */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Utilitários</h2>
        <button
          onClick={showAllCookies}
          className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600"
        >
          Mostrar Todos os Cookies (Console)
        </button>
      </div>
    </div>
  );
}