'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Package, Truck, Star } from 'lucide-react';

export default function StatusPedido({ pedidoId, statusAtual, onStatusChange }) {
  const [status, setStatus] = useState(statusAtual);
  
  const statusOptions = [
    { id: 'PENDENTE', label: 'Aguardando Pagamento', icon: Clock, color: 'text-yellow-500' },
    { id: 'CONFIRMADO', label: 'Pagamento Confirmado', icon: CheckCircle, color: 'text-green-500' },
    { id: 'PROCESSANDO', label: 'Preparando Pedido', icon: Package, color: 'text-blue-500' },
    { id: 'ENVIADO', label: 'Pedido Enviado', icon: Truck, color: 'text-purple-500' },
    { id: 'ENTREGUE', label: 'Entregue', icon: Star, color: 'text-green-600' }
  ];

  useEffect(() => {
    setStatus(statusAtual);
  }, [statusAtual]);

  const getStatusIndex = (currentStatus) => {
    return statusOptions.findIndex(option => option.id === currentStatus);
  };

  const isCompleted = (stepIndex) => {
    return stepIndex <= getStatusIndex(status);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-6">Status do Pedido #{pedidoId}</h3>
      
      <div className="relative">
        {/* Linha de progresso */}
        <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-200"></div>
        <div 
          className="absolute left-6 top-8 w-0.5 bg-green-500 transition-all duration-500"
          style={{ height: `${(getStatusIndex(status) / (statusOptions.length - 1)) * 100}%` }}
        ></div>
        
        {/* Etapas */}
        <div className="space-y-6">
          {statusOptions.map((step, index) => {
            const Icon = step.icon;
            const completed = isCompleted(index);
            const current = step.id === status;
            
            return (
              <div key={step.id} className="relative flex items-center">
                {/* Ícone */}
                <div className={`
                  relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                  ${completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'bg-white border-gray-300 text-gray-400'
                  }
                  ${current && 'ring-4 ring-green-100 scale-110'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                
                {/* Conteúdo */}
                <div className="ml-4 flex-1">
                  <div className={`
                    font-medium transition-colors duration-300
                    ${completed ? 'text-gray-900' : 'text-gray-500'}
                    ${current && 'text-green-700'}
                  `}>
                    {step.label}
                  </div>
                  
                  {current && (
                    <div className="text-sm text-green-600 mt-1">
                      Status atual
                    </div>
                  )}
                  
                  {completed && step.id !== status && (
                    <div className="text-sm text-gray-500 mt-1">
                      ✓ Concluído
                    </div>
                  )}
                </div>
                
                {/* Timestamp (simulado) */}
                {completed && (
                  <div className="text-sm text-gray-500">
                    {new Date().toLocaleString('pt-BR')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Informações adicionais baseadas no status */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        {status === 'PENDENTE' && (
          <div>
            <p className="text-sm text-gray-600">
              💡 <strong>Aguardando pagamento:</strong> Complete o pagamento para que possamos processar seu pedido.
            </p>
          </div>
        )}
        
        {status === 'CONFIRMADO' && (
          <div>
            <p className="text-sm text-gray-600">
              🎉 <strong>Pagamento confirmado:</strong> Seu pedido foi confirmado e será processado em breve.
            </p>
          </div>
        )}
        
        {status === 'PROCESSANDO' && (
          <div>
            <p className="text-sm text-gray-600">
              📦 <strong>Preparando pedido:</strong> Estamos separando seus produtos com muito cuidado.
            </p>
          </div>
        )}
        
        {status === 'ENVIADO' && (
          <div>
            <p className="text-sm text-gray-600">
              🚚 <strong>Pedido enviado:</strong> Seu pedido está a caminho! Você receberá o código de rastreamento por email.
            </p>
            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
              <strong>Código de rastreamento:</strong> BR123456789BR
            </div>
          </div>
        )}
        
        {status === 'ENTREGUE' && (
          <div>
            <p className="text-sm text-gray-600">
              ⭐ <strong>Pedido entregue:</strong> Seu pedido foi entregue com sucesso! Que tal avaliar sua experiência?
            </p>
            <button className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-sm">
              Avaliar Pedido
            </button>
          </div>
        )}
      </div>
      
      {/* Simulação de atualização automática */}
      {status !== 'ENTREGUE' && (
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              // Simular avanço do status
              const currentIndex = getStatusIndex(status);
              if (currentIndex < statusOptions.length - 1) {
                const nextStatus = statusOptions[currentIndex + 1].id;
                setStatus(nextStatus);
                if (onStatusChange) {
                  onStatusChange(nextStatus);
                }
              }
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            🔄 Simular atualização do status
          </button>
        </div>
      )}
    </div>
  );
}