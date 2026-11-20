"use client";
import React, { useState, useEffect } from 'react';
import { 
  Accessibility, 
  Type, 
  Eye, 
  Volume2, 
  Settings,
  Plus,
  Minus,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function AccessibilityWidget() {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 100, // porcentagem
    contrast: 'normal', // normal, high, dark
    soundEnabled: false,
    libras: false
  });

  useEffect(() => {
    // Carregar configurações salvas
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    // Salvar configurações
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    
    // Aplicar configurações
    applySettings();
  }, [settings]);

  const applySettings = () => {
    const root = document.documentElement;
    
    // Tamanho da fonte
    root.style.fontSize = `${settings.fontSize}%`;
    
    // Contraste
    root.className = root.className.replace(/contrast-\w+/g, '');
    if (settings.contrast !== 'normal') {
      root.classList.add(`contrast-${settings.contrast}`);
    }
  };

  const adjustFontSize = (direction: 'increase' | 'decrease') => {
    setSettings(prev => ({
      ...prev,
      fontSize: Math.max(80, Math.min(150, 
        prev.fontSize + (direction === 'increase' ? 10 : -10)
      ))
    }));
  };

  const toggleContrast = () => {
    setSettings(prev => ({
      ...prev,
      contrast: prev.contrast === 'normal' ? 'high' : 
                prev.contrast === 'high' ? 'dark' : 'normal'
    }));
  };

  const resetSettings = () => {
    setSettings({
      fontSize: 100,
      contrast: 'normal',
      soundEnabled: false,
      libras: false
    });
  };

  const openLibrasVideo = () => {
    // Simular abertura do player de Libras
    showToast('Funcionalidade de Libras ativada!', 'success');
    setSettings(prev => ({ ...prev, libras: !prev.libras }));
  };

  return (
    <>
      {/* Botão flutuante de acessibilidade */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Abrir painel de acessibilidade"
          title="Acessibilidade"
        >
          <Accessibility className="w-6 h-6" />
        </button>
      </div>

      {/* Painel de acessibilidade */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 w-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Acessibilidade
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Fechar painel"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Tamanho da fonte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamanho da fonte ({settings.fontSize}%)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustFontSize('decrease')}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={settings.fontSize <= 80}
                  aria-label="Diminuir fonte"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 bg-gray-200 h-2 rounded">
                  <div 
                    className="bg-blue-600 h-2 rounded transition-all"
                    style={{ width: `${((settings.fontSize - 80) / 70) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => adjustFontSize('increase')}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={settings.fontSize >= 150}
                  aria-label="Aumentar fonte"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contraste */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraste
              </label>
              <button
                onClick={toggleContrast}
                className="w-full flex items-center gap-2 p-3 border border-gray-300 rounded hover:bg-gray-50"
              >
                <Eye className="w-4 h-4" />
                {settings.contrast === 'normal' ? 'Normal' :
                 settings.contrast === 'high' ? 'Alto contraste' : 'Modo escuro'}
              </button>
            </div>

            {/* Libras */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intérprete de Libras
              </label>
              <button
                onClick={openLibrasVideo}
                className={`w-full flex items-center gap-2 p-3 border rounded transition-colors ${
                  settings.libras 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">🤟</span>
                {settings.libras ? 'Libras Ativo' : 'Ativar Libras'}
              </button>
            </div>

            {/* Sons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback sonoro
              </label>
              <button
                onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                className={`w-full flex items-center gap-2 p-3 border rounded transition-colors ${
                  settings.soundEnabled 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                {settings.soundEnabled ? 'Som Ativo' : 'Ativar Sons'}
              </button>
            </div>

            {/* Reset */}
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={resetSettings}
                className="w-full flex items-center justify-center gap-2 p-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Resetar configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS para contraste */}
      <style jsx global>{`
        .contrast-high {
          filter: contrast(150%) brightness(110%);
        }
        
        .contrast-dark {
          filter: invert(100%) hue-rotate(180deg);
        }
        
        .contrast-dark img {
          filter: invert(100%) hue-rotate(180deg);
        }
      `}</style>
    </>
  );
}