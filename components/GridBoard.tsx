/*
 * RoboDibuix
 * Copyright (C) 2025 David Cordones
 * Licensed under AGPL v3
 */

import React, { useRef, useEffect } from 'react';
import { RobotState, Point } from '../types';
import { GRID_SIZE, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { Robot } from './Robot';

interface GridBoardProps {
  robotState: RobotState;
  path: Point[];
  tempPathLine?: Point | null; 
  isDarkMode: boolean;
}

export const GridBoard: React.FC<GridBoardProps> = ({ robotState, path, isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Determine colors based on mode
    const bgColor = isDarkMode ? '#1e293b' : '#ffffff';
    const gridColor = isDarkMode ? COLORS.gridDark : COLORS.grid;

    // Clear background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Draw Grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // 2. Draw Path
    if (path.length > 1) {
      ctx.strokeStyle = COLORS.path;
      ctx.lineWidth = 4; // Thicker line for better visibility
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    }
    
    // Draw start dot just in case
    if (path.length > 0) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(path[0].x, path[0].y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
  }, [path, isDarkMode]);

  return (
    <div className="relative shadow-xl rounded-lg overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      {/* Canvas Layer */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="block"
      />
      
      {/* Robot Layer - Absolutely positioned on top */}
      <Robot state={robotState} />
      
      {/* Info Overlay */}
      <div className="absolute top-4 left-4 z-40 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-3 py-2 rounded-md shadow text-xs text-slate-500 dark:text-slate-400 pointer-events-none border border-slate-100 dark:border-slate-700">
        <div className="font-mono">X: {Math.round((robotState.x - CANVAS_WIDTH/2) / GRID_SIZE)}</div>
        <div className="font-mono">Y: {Math.round(-(robotState.y - CANVAS_HEIGHT/2) / GRID_SIZE)}</div>
        <div className="font-mono">Ang: {Math.round(robotState.angle + 90) % 360}°</div>
      </div>
    </div>
  );
};