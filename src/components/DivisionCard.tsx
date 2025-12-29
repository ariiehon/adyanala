import { CheckCircle } from 'lucide-react';

interface DivisionCardProps {
  title: string;
  description: string;
  requirements: string[];
}

export function DivisionCard({ title, description, requirements }: DivisionCardProps) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 duration-300 h-full flex flex-col">
      
      <div className="mb-4">
        <h3 className="text-[#0D652D] font-bold text-lg">{title}</h3>
      </div>
      <p className="text-gray-600 mb-6">
        {description}
      </p>
      
      {/* Bagian Proker */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-700">Proker/Agenda:</p>
        {requirements.map((req, index) => (
          <div key={index} className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-[#34A853] flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-600 leading-snug">{req}</span>
          </div>
        ))}
      </div>
      
    </div>
  );
}