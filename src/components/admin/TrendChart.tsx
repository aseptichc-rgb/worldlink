'use client';

import { motion } from 'framer-motion';

interface TrendChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export default function TrendChart({ data, height = 160 }: TrendChartProps) {
  const maxCount = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          {item.value > 0 && (
            <span className="text-[10px] text-[#8B949E] leading-none">{item.value}</span>
          )}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(item.value / maxCount) * 100}%` }}
            transition={{ duration: 0.5, delay: i * 0.02 }}
            className="w-full bg-gradient-to-t from-[#1F6FEB] to-[#58A6FF] rounded-t-sm"
            style={{ minHeight: item.value > 0 ? 4 : 0 }}
          />
          <span className="text-[9px] text-[#484F58] truncate w-full text-center leading-none">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
