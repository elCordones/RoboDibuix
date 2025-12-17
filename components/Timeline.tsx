/*
 * RoboDibuix
 * Copyright (C) 2025 David Cordones
 * Licensed under AGPL v3
 */

import React from 'react';
import { Command, CommandType } from '../types';
import { X, Plus } from 'lucide-react';

interface TimelineProps {
  commands: Command[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, value: number) => void;
  onEnterNested?: (commandId: string) => void; // When user wants to edit inside a loop
  parentId?: string;
  isNestedView?: boolean;
  onGoBack?: () => void;
  t: (key: string) => string;
}

export const Timeline: React.FC<TimelineProps> = ({ 
  commands, 
  onRemove, 
  onUpdate, 
  onEnterNested, 
  parentId,
  isNestedView = false,
  onGoBack,
  t
}) => {
  
  if (isNestedView && parentId) {
    return (
       <div className="flex flex-col h-full">
         <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
           <button 
             onClick={onGoBack}
             className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded"
           >
             ← {t('back')}
           </button>
           <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">{t('editing_loop')}</span>
         </div>
         <div className="flex gap-2 overflow-x-auto pb-2 flex-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            {commands.length === 0 && (
              <div className="flex items-center justify-center w-full text-slate-400 dark:text-slate-500 text-sm italic border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                {t('empty_loop')}
              </div>
            )}
            {commands.map(cmd => (
              <CommandBlock 
                key={cmd.id} 
                cmd={cmd} 
                onRemove={onRemove} 
                onUpdate={onUpdate}
                onEnterNested={onEnterNested} 
                t={t}
              />
            ))}
         </div>
       </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 h-full items-center scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
      {commands.length === 0 && (
        <div className="text-slate-400 dark:text-slate-500 text-sm italic w-full text-center">
          {t('empty_cmds')}
        </div>
      )}
      {commands.map((cmd) => (
        <CommandBlock 
          key={cmd.id} 
          cmd={cmd} 
          onRemove={onRemove} 
          onUpdate={onUpdate}
          onEnterNested={onEnterNested}
          t={t}
        />
      ))}
    </div>
  );
};

const CommandBlock: React.FC<{
  cmd: Command;
  onRemove: (id: string) => void;
  onUpdate: (id: string, value: number) => void;
  onEnterNested?: (id: string) => void;
  t: (key: string) => string;
}> = ({ cmd, onRemove, onUpdate, onEnterNested, t }) => {
  
  const getColor = () => {
    switch(cmd.type) {
      case CommandType.FORWARD: return 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/50 dark:border-emerald-700 dark:text-emerald-200';
      case CommandType.BACKWARD: return 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/50 dark:border-emerald-700 dark:text-emerald-200';
      case CommandType.TURN_LEFT: return 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-200';
      case CommandType.TURN_RIGHT: return 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-200';
      case CommandType.REPEAT: return 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/50 dark:border-purple-700 dark:text-purple-200';
      default: return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  const getLabel = () => {
    switch(cmd.type) {
      case CommandType.FORWARD: return t('cmd_forward');
      case CommandType.BACKWARD: return t('cmd_backward');
      case CommandType.TURN_LEFT: return t('cmd_left');
      case CommandType.TURN_RIGHT: return t('cmd_right');
      case CommandType.REPEAT: return t('cmd_repeat');
    }
  };

  const getUnit = () => {
    if (cmd.type === CommandType.REPEAT) return t('times');
    if (cmd.type === CommandType.TURN_LEFT || cmd.type === CommandType.TURN_RIGHT) return '°';
    return 'cm';
  };

  return (
    <div className={`relative flex-shrink-0 flex flex-col items-center justify-between w-28 h-28 p-2 rounded-lg border-2 ${getColor()} shadow-sm transition-transform hover:scale-105 group`}>
      <button 
        onClick={() => onRemove(cmd.id)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
      >
        <X size={12} />
      </button>

      <span className="text-xs font-bold uppercase tracking-wide text-center leading-tight">{getLabel()}</span>

      <div className="flex items-center gap-1 my-1">
        <input
          type="number"
          value={cmd.value}
          onChange={(e) => onUpdate(cmd.id, parseInt(e.target.value) || 0)}
          className="w-12 text-center text-sm font-mono border rounded p-1 bg-white/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 dark:bg-black/20 dark:text-white dark:border-slate-600"
          min={1}
          max={360}
        />
        <span className="text-[10px] opacity-70">{getUnit()}</span>
      </div>

      {cmd.type === CommandType.REPEAT ? (
        <button 
          onClick={() => onEnterNested && onEnterNested(cmd.id)}
          className="w-full text-[10px] bg-purple-200 hover:bg-purple-300 text-purple-900 dark:bg-purple-800 dark:hover:bg-purple-700 dark:text-purple-100 px-2 py-1 rounded flex items-center justify-center gap-1 transition-colors"
        >
          <span className="font-bold">{cmd.children?.length || 0}</span>
          <Plus size={10} />
        </button>
      ) : (
        <div className="h-4"></div> // Spacer
      )}
    </div>
  );
};
