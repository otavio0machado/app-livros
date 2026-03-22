'use client';

const CONDITIONS = [
  'Novo',
  'Usado - Excelente estado, como novo.',
  'Usado - Contém marcas de uso.',
  'Usado - Contém marcas de uso e pode conter poucos escritos ou marcações.',
  'Usado - Pode conter poucos escritos ou marcações.',
  'Usado - Contém marcas de uso, bastante marcações, escritos e/ou exercícios resolvidos.',
  'Usado - Contém bastante marcações, escritos e/ou exercícios resolvidos.',
];

interface ConditionSelectorProps {
  value: string;
  onChange: (condition: string) => void;
  required?: boolean;
}

export default function ConditionSelector({ value, onChange, required }: ConditionSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-warm-700 mb-2">
        Condição do produto {required && <span className="text-red-500">*</span>}
      </label>
      <div className="space-y-2">
        {CONDITIONS.map((c) => (
          <label
            key={c}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
              value === c
                ? 'border-navy-500 bg-navy-50'
                : 'border-warm-200 hover:border-warm-300'
            }`}
          >
            <input
              type="radio"
              name="condition_detail"
              value={c}
              checked={value === c}
              onChange={(e) => onChange(e.target.value)}
              className="w-4 h-4 text-navy-700"
            />
            <span className="text-sm text-warm-700">{c}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
