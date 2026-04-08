'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, DollarSign, Lightbulb, Mic, BookOpen, Edit3, Plus, X, Trash2 } from 'lucide-react';
import type { Achievement, AchievementType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AchievementTimelineProps {
  achievements: Achievement[];
  editable?: boolean;
  onAdd?: (achievement: Achievement) => void;
  onRemove?: (id: string) => void;
}

const TYPE_CONFIG: Record<AchievementType, { icon: typeof Award; label: string; color: string }> = {
  'award': { icon: Award, label: '수상', color: '#F59E0B' },
  'grant': { icon: DollarSign, label: '연구비', color: '#3FB950' },
  'patent': { icon: Lightbulb, label: '특허', color: '#0EA5E9' },
  'invited-talk': { icon: Mic, label: '초청강연', color: '#A371F7' },
  'fellowship': { icon: BookOpen, label: '펠로우십', color: '#EC4899' },
  'editorial': { icon: Edit3, label: '편집위원', color: '#1ABC9C' },
  'other': { icon: Award, label: '기타', color: '#8B949E' },
};

export default function AchievementTimeline({ achievements, editable = false, onAdd, onRemove }: AchievementTimelineProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'award' as AchievementType,
    title: '',
    description: '',
    organization: '',
    year: new Date().getFullYear(),
    amount: '',
    url: '',
  });

  const sorted = [...achievements].sort((a, b) => b.year - a.year);

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const achievement: Achievement = {
      id: uuidv4(),
      researcherId: '',
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      organization: form.organization.trim() || undefined,
      year: form.year,
      amount: form.amount.trim() || undefined,
      url: form.url.trim() || undefined,
      createdAt: new Date(),
    };
    onAdd?.(achievement);
    setForm({ type: 'award', title: '', description: '', organization: '', year: new Date().getFullYear(), amount: '', url: '' });
    setShowForm(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#F0F6FC]">연구 업적</h3>
        {editable && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-xs text-[#0EA5E9] hover:text-[#0EA5E9]/80"
          >
            <Plus size={14} />
            업적 추가
          </button>
        )}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 rounded-xl bg-[#1E1E1E] border border-[#30363D] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#8B949E] mb-1 block">유형</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as AchievementType }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#252525] border border-[#30363D] text-[#F0F6FC] text-sm"
                  >
                    {Object.entries(TYPE_CONFIG).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#8B949E] mb-1 block">연도</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#252525] border border-[#30363D] text-[#F0F6FC] text-sm"
                  />
                </div>
              </div>
              <input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="업적 제목 *"
                className="w-full px-3 py-2 rounded-lg bg-[#252525] border border-[#30363D] text-[#F0F6FC] text-sm"
              />
              <input
                value={form.organization}
                onChange={(e) => setForm(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="수여 기관"
                className="w-full px-3 py-2 rounded-lg bg-[#252525] border border-[#30363D] text-[#F0F6FC] text-sm"
              />
              {form.type === 'grant' && (
                <input
                  value={form.amount}
                  onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="연구비 금액"
                  className="w-full px-3 py-2 rounded-lg bg-[#252525] border border-[#30363D] text-[#F0F6FC] text-sm"
                />
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg bg-[#252525] text-[#8B949E] text-sm">
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.title.trim()}
                  className="flex-1 py-2 rounded-lg bg-[#0EA5E9] text-white text-sm font-medium disabled:opacity-50"
                >
                  추가
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      {sorted.length === 0 ? (
        <p className="text-xs text-[#484F58] text-center py-4">등록된 업적이 없습니다</p>
      ) : (
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-[#30363D]" />

          <div className="space-y-4">
            {sorted.map((ach, index) => {
              const config = TYPE_CONFIG[ach.type] || TYPE_CONFIG['other'];
              const Icon = config.icon;
              return (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group"
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute -left-6 top-1.5 w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 bg-[#121212]"
                    style={{ borderColor: config.color }}
                  >
                    <Icon size={10} style={{ color: config.color }} />
                  </div>

                  {/* Content */}
                  <div className="pb-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ backgroundColor: `${config.color}15`, color: config.color }}
                          >
                            {config.label}
                          </span>
                          <span className="text-xs text-[#484F58]">{ach.year}</span>
                        </div>
                        <p className="text-sm text-[#F0F6FC] mt-1 font-medium">{ach.title}</p>
                        {ach.organization && (
                          <p className="text-xs text-[#8B949E] mt-0.5">{ach.organization}</p>
                        )}
                        {ach.amount && (
                          <p className="text-xs text-[#3FB950] mt-0.5">{ach.amount}</p>
                        )}
                      </div>
                      {editable && (
                        <button
                          onClick={() => onRemove?.(ach.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#484F58] hover:text-[#F85149] transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
