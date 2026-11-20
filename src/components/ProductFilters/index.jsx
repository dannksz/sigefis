'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Filter, X, Search } from 'lucide-react';

export default function ProductFilters({ onFiltersChange, currentFilters = {} }) {
  const [filters, setFilters] = useState({
    liga: '',
    time: '',
    cor: '',
    tamanho: '',
    precoMin: '',
    precoMax: '',
    busca: '',
    ordenacao: 'nome',
    ...currentFilters
  });

  const [options, setOptions] = useState({
    ligas: [],
    times: [],
    cores: [],
    tamanhos: [],
    timesDisponiveis: []
  });

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carregar opções iniciais
  useEffect(() => {
    loadInitialOptions();
  }, []);

  // Carregar times quando liga muda (filtro cascata)
  useEffect(() => {
    if (filters.liga) {
      loadTimesByLiga(filters.liga);
    } else {
      setOptions(prev => ({ ...prev, timesDisponiveis: [] }));
      setFilters(prev => ({ ...prev, time: '' }));
    }
  }, [filters.liga]);

  // Notificar mudanças de filtro
  useEffect(() => {
    const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    onFiltersChange(activeFilters);
  }, [filters, onFiltersChange]);

  const loadInitialOptions = async () => {
    setLoading(true);
    try {
      const [ligasRes, coresRes, tamanhosRes] = await Promise.all([
        fetch('/api/ligas'),
        fetch('/api/cores'),
        fetch('/api/tamanhos')
      ]);

      const [ligas, cores, tamanhos] = await Promise.all([
        ligasRes.json(),
        coresRes.json(),
        tamanhosRes.json()
      ]);

      setOptions(prev => ({
        ...prev,
        ligas,
        cores,
        tamanhos
      }));
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimesByLiga = async (ligaId) => {
    try {
      const response = await fetch(`/api/times?liga=${ligaId}`);
      const times = await response.json();
      setOptions(prev => ({ ...prev, timesDisponiveis: times }));
    } catch (error) {
      console.error('Erro ao carregar times:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      liga: '',
      time: '',
      cor: '',
      tamanho: '',
      precoMin: '',
      precoMax: '',
      busca: '',
      ordenacao: 'nome'
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'ordenacao' && value && value !== ''
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Header com Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {Object.values(filters).filter(v => v && v !== '' && v !== 'nome').length}
            </span>
          )}
        </h2>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden flex items-center text-gray-600 hover:text-gray-800"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`} />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className={`grid gap-4 ${
        isOpen ? 'block' : 'hidden lg:block'
      } lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2`}>
        
        {/* Busca por texto */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar produtos
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.busca}
              onChange={(e) => handleFilterChange('busca', e.target.value)}
              placeholder="Digite o nome do produto..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Ordenação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ordenar por
          </label>
          <select
            value={filters.ordenacao}
            onChange={(e) => handleFilterChange('ordenacao', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="nome">Nome (A-Z)</option>
            <option value="preco-asc">Menor preço</option>
            <option value="preco-desc">Maior preço</option>
            <option value="mais-recentes">Mais recentes</option>
          </select>
        </div>

        {/* Liga */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Liga
          </label>
          <select
            value={filters.liga}
            onChange={(e) => handleFilterChange('liga', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="">Todas as ligas</option>
            {options.ligas.map((liga) => (
              <option key={liga.id} value={liga.id}>
                {liga.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Time (Cascata) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time
          </label>
          <select
            value={filters.time}
            onChange={(e) => handleFilterChange('time', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={!filters.liga || options.timesDisponiveis.length === 0}
          >
            <option value="">
              {!filters.liga 
                ? 'Selecione uma liga primeiro'
                : options.timesDisponiveis.length === 0
                ? 'Carregando times...'
                : 'Todos os times'
              }
            </option>
            {options.timesDisponiveis.map((time) => (
              <option key={time.id} value={time.id}>
                {time.nome} ({time.cidade})
              </option>
            ))}
          </select>
        </div>

        {/* Cor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cor
          </label>
          <select
            value={filters.cor}
            onChange={(e) => handleFilterChange('cor', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas as cores</option>
            {options.cores.map((cor) => (
              <option key={cor.id} value={cor.id}>
                {cor.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Tamanho */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tamanho
          </label>
          <select
            value={filters.tamanho}
            onChange={(e) => handleFilterChange('tamanho', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos os tamanhos</option>
            {options.tamanhos.map((tamanho) => (
              <option key={tamanho.id} value={tamanho.id}>
                {tamanho.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Faixa de Preço */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preço mínimo
          </label>
          <input
            type="number"
            value={filters.precoMin}
            onChange={(e) => handleFilterChange('precoMin', e.target.value)}
            placeholder="R$ 0,00"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preço máximo
          </label>
          <input
            type="number"
            value={filters.precoMax}
            onChange={(e) => handleFilterChange('precoMax', e.target.value)}
            placeholder="R$ 1000,00"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filtros ativos */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">Filtros ativos:</span>
            {Object.entries(filters).map(([key, value]) => {
              if (!value || value === '' || key === 'ordenacao') return null;
              
              let label = value;
              if (key === 'liga') label = options.ligas.find(l => l.id == value)?.nome || value;
              if (key === 'time') label = options.timesDisponiveis.find(t => t.id == value)?.nome || value;
              if (key === 'cor') label = options.cores.find(c => c.id == value)?.nome || value;
              if (key === 'tamanho') label = options.tamanhos.find(t => t.id == value)?.nome || value;
              if (key === 'precoMin') label = `Min: R$ ${value}`;
              if (key === 'precoMax') label = `Max: R$ ${value}`;
              
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {label}
                  <button
                    onClick={() => handleFilterChange(key, '')}
                    className="ml-1.5 w-3 h-3 rounded-full text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}