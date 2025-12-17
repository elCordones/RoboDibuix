/*
 * RoboDibuix
 * Copyright (C) 2025 David Cordones
 * Licensed under AGPL v3
 */

import React from 'react';
import { CommandType } from '../types';
import { ArrowUp, ArrowDown, RotateCw, RotateCcw, Repeat } from 'lucide-react';

interface CommandPaletteProps {
  onAddCommand: (type: CommandType) => void;
  disabled: boolean;
  t: (key: string) => string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onAddCommand, disabled, t }) => {
  const buttons = [
    { type: CommandType.FORWARD, label: t('cmd_forward'), icon: ArrowUp, color: 'bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700' },
    { type: CommandType.BACKWARD, label: t('cmd_backward'), icon: ArrowDown, color: 'bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700' },
    { type: CommandType.TURN_LEFT, label: t('cmd_left'), icon: RotateCcw, color: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700' },
    { type: CommandType.TURN_RIGHT, label: t('cmd_right'), icon: RotateCw, color: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700' },
    { type: CommandType.REPEAT, label: t('cmd_repeat'), icon: Repeat, color: 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700' },
  ];

  return (
    <div className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full">
      <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{t('commands')}</h2>
      {buttons.map((btn) => (
        <button
          key={btn.type}
          onClick={() => onAddCommand(btn.type)}
          disabled={disabled}
          className={`${btn.color} text-white p-3 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <btn.icon size={20} />
          <span className="font-semibold">{btn.label}</span>
        </button>
      ))}
    </div>
  );
};
