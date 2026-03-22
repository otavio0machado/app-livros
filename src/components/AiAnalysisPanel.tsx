'use client';

import type { GeminiAnalysis } from '@/types';

interface AiAnalysisPanelProps {
  loading: boolean;
  analysis: GeminiAnalysis | null;
  error: string;
  onApply: () => void;
}

export default function AiAnalysisPanel({ loading, analysis, error, onApply }: AiAnalysisPanelProps) {
  if (loading) {
    return (
      <div className="bg-blue-50 rounded-2xl p-6 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-blue-700 font-medium">Analisando imagem com IA...</p>
        <p className="text-blue-500 text-sm mt-1">Isso pode levar alguns segundos</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-2xl p-4">
        <p className="text-red-700 text-sm font-medium">Erro na análise</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="bg-green-50 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-green-700 font-medium text-sm">IA identificou o produto</p>
          <p className="text-green-600 text-xs mt-0.5">
            {analysis.type === 'Apostila' ? 'Apostila de cursinho' : 'Livro'}
          </p>
        </div>
        <button
          onClick={onApply}
          className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition"
        >
          Aplicar dados
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-green-600">Título:</span>
          <p className="text-gray-900 font-medium truncate">{analysis.title}</p>
        </div>
        <div>
          <span className="text-green-600">Autor:</span>
          <p className="text-gray-900 font-medium truncate">{analysis.author}</p>
        </div>
        <div>
          <span className="text-green-600">Editora:</span>
          <p className="text-gray-900 font-medium truncate">{analysis.publisher}</p>
        </div>
        <div>
          <span className="text-green-600">Preço sugerido:</span>
          <p className="text-gray-900 font-medium">
            R$ {(analysis.suggested_price_cents / 100).toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>
    </div>
  );
}
