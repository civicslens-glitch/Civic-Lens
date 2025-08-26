import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimeSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function TimeSlider({ value, onChange }: TimeSliderProps) {
  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 transition-colors duration-300"
    >
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Time of Day</span>
        </div>
        
        <div className="flex-1 relative">
          <Slider
            value={[value]}
            onValueChange={(values) => onChange(values[0])}
            max={23}
            min={0}
            step={1}
            className="w-full"
            data-testid="slider-time"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>6AM</span>
            <span>12PM</span>
            <span>6PM</span>
            <span>12AM</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-1">
          <span className="text-sm text-slate-600 dark:text-slate-300">Current:</span>
          <span className="text-sm font-medium text-slate-900 dark:text-white" data-testid="text-current-time">
            {formatTime(value)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
