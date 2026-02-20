'use client';

import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  subLabel?: string;
}

export default function StatCard({ icon, label, value, color, subLabel }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div
            className="p-3 rounded-xl flex-shrink-0"
            style={{ backgroundColor: `${color}15` }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-[#8B949E]">{label}</p>
            {subLabel && (
              <p className="text-xs mt-0.5" style={{ color }}>{subLabel}</p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
