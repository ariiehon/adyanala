import { Calendar, CheckCircle } from 'lucide-react';

interface TimelineItemProps {
  date: string;
  title: string;
  description: string;
  isLast?: boolean;
}

export function TimelineItem({ date, title, description, isLast }: TimelineItemProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#174EA6] to-[#4285F4] flex items-center justify-center flex-shrink-0">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        {!isLast && (
          <div className="w-1 flex-1 bg-gradient-to-b from-[#174EA6] to-[#4285F4] min-h-[60px] my-2" />
        )}
      </div>
      
      <div className="flex-1 pb-8">
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm px-3 py-1 bg-gradient-to-r from-[#0D652D] to-[#34A853] text-white rounded-full">
              {date}
            </span>
          </div>
          <h3 className="mb-2 text-[#0D652D]">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
