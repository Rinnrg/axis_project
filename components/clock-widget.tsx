'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function ClockWidget() {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 text-slate-700">
      <Clock className="w-5 h-5 text-indigo-600" />
      <div>
        <p className="text-2xl font-bold">{time}</p>
        <p className="text-sm text-slate-500">{date}</p>
      </div>
    </div>
  );
}
