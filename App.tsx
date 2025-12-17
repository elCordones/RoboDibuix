/*
 * RoboDibuix
 * Copyright (C) 2025 David Cordones
 * Licensed under AGPL v3
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Play, Trash2, StopCircle, Settings, Globe, Moon, Sun, Monitor } from 'lucide-react';
import { Command, CommandType, RobotState, Point } from './types';
import { GridBoard } from './components/GridBoard';
import { CommandPalette } from './components/CommandPalette';
import { Timeline } from './components/Timeline';
import { 
  GRID_SIZE, 
  START_X, 
  START_Y, 
  START_ANGLE, 
  ANIMATION_DELAY 
} from './constants';
import { playSound } from './utils/audio';
import { translations, Language } from './translations';

// --- Types ---

type Theme = 'light' | 'dark' | 'system';

// --- Helper to convert degrees to radians ---
const toRad = (deg: number) => (deg * Math.PI) / 180;

const App: React.FC = () => {
  // --- Settings State ---
  const [language, setLanguage] = useState<Language>(() => {
    // Basic auto-detect
    const navLang = navigator.language.split('-')[0];
    if (['ca', 'es', 'gl', 'eu', 'en'].includes(navLang)) return navLang as Language;
    return 'ca'; // Default fallback
  });
  
  const [theme, setTheme] = useState<Theme>('system');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Translation Helper ---
  const t = useCallback((key: string) => {
    // @ts-ignore
    return translations[language][key] || key;
  }, [language]);

  // --- Theme Effect ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);


  // --- App State ---
  const [commands, setCommands] = useState<Command[]>([]);
  const [activeContainerId, setActiveContainerId] = useState<string | null>(null);
  
  const [robotState, setRobotState] = useState<RobotState>({
    x: START_X,
    y: START_Y,
    angle: START_ANGLE,
    penDown: true,
  });

  const [path, setPath] = useState<Point[]>([{ x: START_X, y: START_Y }]);
  const [isPlaying, setIsPlaying] = useState(false);
  const stopRef = useRef(false);

  // --- Helpers to manage nested state ---
  
  // Pure function to update the immutable tree
  const updateTree = (cmds: Command[], parentId: string | null, updateFn: (list: Command[]) => Command[]): Command[] => {
    if (parentId === null) {
      return updateFn(cmds);
    }
    return cmds.map(cmd => {
      if (cmd.id === parentId) {
        return { ...cmd, children: updateFn(cmd.children || []) };
      }
      if (cmd.children) {
        return { ...cmd, children: updateTree(cmd.children, parentId, updateFn) };
      }
      return cmd;
    });
  };

  // --- Actions ---

  const handleAddCommand = (type: CommandType) => {
    playSound('move');
    const newCmd: Command = {
      id: uuidv4(),
      type,
      value: type === CommandType.REPEAT ? 2 : (type === CommandType.TURN_LEFT || type === CommandType.TURN_RIGHT ? 90 : 1),
      children: type === CommandType.REPEAT ? [] : undefined,
    };

    setCommands(prev => updateTree(prev, activeContainerId, (list) => [...list, newCmd]));
  };

  const handleRemoveCommand = (id: string) => {
    playSound('clear');
    const recursiveFilter = (list: Command[]): Command[] => {
      return list.filter(c => c.id !== id).map(c => ({
        ...c,
        children: c.children ? recursiveFilter(c.children) : undefined
      }));
    };
    setCommands(prev => recursiveFilter(prev));
  };

  const handleUpdateCommand = (id: string, value: number) => {
    const recursiveUpdate = (list: Command[]): Command[] => {
      return list.map(c => {
        if (c.id === id) return { ...c, value };
        if (c.children) return { ...c, children: recursiveUpdate(c.children) };
        return c;
      });
    };
    setCommands(prev => recursiveUpdate(prev));
  };

  const handleClearAll = () => {
    playSound('clear');
    setCommands([]);
    setPath([{ x: START_X, y: START_Y }]);
    setRobotState({ x: START_X, y: START_Y, angle: START_ANGLE, penDown: true });
    setActiveContainerId(null);
    setIsPlaying(false);
  };

  const resetPosition = () => {
    setRobotState({ x: START_X, y: START_Y, angle: START_ANGLE, penDown: true });
    setPath([{ x: START_X, y: START_Y }]);
  };

  // --- Execution Engine ---

  const executeCommand = async (cmd: Command, currentRobot: RobotState): Promise<RobotState> => {
    if (stopRef.current) return currentRobot;

    await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));
    
    let nextRobot = { ...currentRobot };

    switch (cmd.type) {
      case CommandType.FORWARD:
      case CommandType.BACKWARD:
        const distance = cmd.value * GRID_SIZE; // 1 unit = 1 grid cell
        const direction = cmd.type === CommandType.FORWARD ? 1 : -1;
        
        // Calculate new position
        const dx = Math.cos(toRad(nextRobot.angle)) * distance * direction;
        const dy = Math.sin(toRad(nextRobot.angle)) * distance * direction;
        
        nextRobot.x += dx;
        nextRobot.y += dy;
        
        playSound('move');
        setRobotState(nextRobot);
        setPath(prev => [...prev, { x: nextRobot.x, y: nextRobot.y }]);
        break;

      case CommandType.TURN_LEFT:
      case CommandType.TURN_RIGHT:
        const turn = cmd.type === CommandType.TURN_RIGHT ? 1 : -1;
        nextRobot.angle += (cmd.value * turn);
        playSound('turn');
        setRobotState(nextRobot);
        break;
        
      case CommandType.REPEAT:
        if (cmd.children) {
          for (let i = 0; i < cmd.value; i++) {
             // Recursive execution
             nextRobot = await runSequence(cmd.children, nextRobot);
             if (stopRef.current) break;
          }
        }
        break;
    }
    
    return nextRobot;
  };

  const runSequence = async (sequence: Command[], startState: RobotState): Promise<RobotState> => {
    let currentState = startState;
    for (const cmd of sequence) {
      if (stopRef.current) break;
      currentState = await executeCommand(cmd, currentState);
    }
    return currentState;
  };

  const handleRun = async () => {
    if (commands.length === 0) return;
    
    setIsPlaying(true);
    stopRef.current = false;
    resetPosition();
    
    // Initial delay
    await new Promise(r => setTimeout(r, 500));
    playSound('start');

    // Start execution from FRESH state
    const initialState = { x: START_X, y: START_Y, angle: START_ANGLE, penDown: true };
    await runSequence(commands, initialState);
    
    setIsPlaying(false);
  };

  const handleStop = () => {
    stopRef.current = true;
    setIsPlaying(false);
    playSound('error'); // stop sound
  };

  // --- View Logic ---

  // Get the commands for the currently viewed container
  const getVisibleCommands = () => {
    const findById = (list: Command[], id: string): Command | null => {
        for (const c of list) {
            if (c.id === id) return c;
            if (c.children) {
                const found = findById(c.children, id);
                if (found) return found;
            }
        }
        return null;
    }

    if (!activeContainerId) return commands;
    const container = findById(commands, activeContainerId);
    return container ? (container.children || []) : [];
  };

  const isDarkModeComputed = () => {
     if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
     return theme === 'dark';
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            <span className="text-brand-600 dark:text-brand-500">Robo</span>Dibuix
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('subtitle')}</p>
        </div>
        
        <div className="flex gap-2 items-center">
           
           {/* Settings Dropdown Toggle */}
           <div className="relative mr-2">
             <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title={t('settings')}
             >
                <Settings size={20} className="text-slate-600 dark:text-slate-300" />
             </button>

             {/* Settings Popover */}
             {isSettingsOpen && (
               <div className="absolute top-10 right-0 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-sm uppercase">{t('settings')}</h3>
                  
                  {/* Theme Selector */}
                  <div className="mb-4">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t('theme')}</label>
                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                      <button 
                        onClick={() => setTheme('light')} 
                        className={`flex-1 flex items-center justify-center py-1 rounded-md text-xs ${theme === 'light' ? 'bg-white dark:bg-slate-600 shadow text-brand-600' : 'text-slate-500'}`}
                      >
                         <Sun size={14} className="mr-1" /> {t('theme_light')}
                      </button>
                      <button 
                        onClick={() => setTheme('dark')} 
                        className={`flex-1 flex items-center justify-center py-1 rounded-md text-xs ${theme === 'dark' ? 'bg-white dark:bg-slate-600 shadow text-brand-600' : 'text-slate-500'}`}
                      >
                         <Moon size={14} className="mr-1" /> {t('theme_dark')}
                      </button>
                      <button 
                        onClick={() => setTheme('system')} 
                        className={`flex-1 flex items-center justify-center py-1 rounded-md text-xs ${theme === 'system' ? 'bg-white dark:bg-slate-600 shadow text-brand-600' : 'text-slate-500'}`}
                      >
                         <Monitor size={14} className="mr-1" /> {t('theme_system')}
                      </button>
                    </div>
                  </div>

                  {/* Language Selector */}
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t('language')}</label>
                    <div className="grid grid-cols-2 gap-2">
                       {(['ca', 'es', 'gl', 'eu', 'en'] as Language[]).map(l => (
                         <button
                           key={l}
                           onClick={() => setLanguage(l)}
                           className={`px-2 py-1 text-xs rounded border ${language === l ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-900/30 dark:border-brand-700 dark:text-brand-300' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                         >
                           {l === 'ca' ? 'Català' : l === 'es' ? 'Español' : l === 'gl' ? 'Galego' : l === 'eu' ? 'Euskera' : 'English'}
                         </button>
                       ))}
                    </div>
                  </div>
               </div>
             )}
             
             {/* Backdrop to close settings */}
             {isSettingsOpen && (
               <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)}></div>
             )}
           </div>

           {!isPlaying ? (
             <button
               onClick={handleRun}
               disabled={commands.length === 0}
               className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <Play size={20} fill="currentColor" /> {t('run')}
             </button>
           ) : (
             <button
               onClick={handleStop}
               className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold shadow-lg transition-transform active:scale-95 animate-pulse"
             >
               <StopCircle size={20} /> {t('stop')}
             </button>
           )}
           
           <button
             onClick={handleClearAll}
             disabled={isPlaying}
             className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full font-semibold transition-colors disabled:opacity-50"
           >
             <Trash2 size={18} /> {t('clear')}
           </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-6 w-full flex-1 min-h-0">
        
        {/* Left Sidebar: Commands */}
        <div className="w-full lg:w-48 flex-shrink-0">
           <CommandPalette onAddCommand={handleAddCommand} disabled={isPlaying} t={t} />
        </div>

        {/* Center: Board */}
        <div className="flex-1 flex justify-center items-start">
           <GridBoard robotState={robotState} path={path} isDarkMode={isDarkModeComputed()} />
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="w-full h-40 mt-6 bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4 overflow-hidden flex flex-col">
         <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                {t('sequence')} {activeContainerId ? `(${t('loop_view')})` : `(${t('main_view')})`}
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">
                {commands.length === 0 ? '0 ' + t('commands') : t('scroll_hint')}
            </span>
         </div>
         <div className="flex-1 min-h-0">
            <Timeline 
              commands={getVisibleCommands()} 
              onRemove={handleRemoveCommand}
              onUpdate={handleUpdateCommand}
              onEnterNested={(id) => setActiveContainerId(id)}
              parentId={activeContainerId || undefined}
              isNestedView={!!activeContainerId}
              onGoBack={() => setActiveContainerId(null)}
              t={t}
            />
         </div>
      </div>

      {/* Footer / Attribution */}
      <footer className="w-full mt-8 mb-4 text-center">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t('footer_auth')} 2025
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap justify-center gap-2">
          <a href="/LICENSE.txt" target="_blank" className="hover:underline hover:text-brand-600 dark:hover:text-brand-400">
            {t('license_code')}
          </a>
          <span>·</span>
          <span className="flex items-center gap-1">
             <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" className="hover:underline hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1">
               {t('license_content')}
               <img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1" alt="CC" className="h-3 w-3 opacity-70" />
               <img src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1" alt="BY" className="h-3 w-3 opacity-70" />
               <img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg?ref=chooser-v1" alt="SA" className="h-3 w-3 opacity-70" />
             </a>
          </span>
        </p>
      </footer>

    </div>
  );
};

export default App;
