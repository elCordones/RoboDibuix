/*
 * RoboDibuix
 * Copyright (C) 2025 David Cordones
 * Licensed under AGPL v3
 */

import React from 'react';
import { RobotState } from '../types';
import { COLORS } from '../constants';

interface RobotProps {
  state: RobotState;
}

export const Robot: React.FC<RobotProps> = ({ state }) => {
  // We use inline styles for the transform to ensure smooth animation
  // The +90 deg adjustment is because 0 degrees in math is "East/Right", 
  // but our robot drawing faces "Up/North" natively.
  return (
    <div
      className="absolute w-16 h-16 z-30 pointer-events-none transition-transform duration-500 ease-in-out"
      style={{
        left: 0,
        top: 0,
        // Translate to position, then center (-32px is half of w-16), then rotate
        transform: `translate(${state.x - 32}px, ${state.y - 32}px) rotate(${state.angle + 90}deg)`,
      }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
        {/* Left Track */}
        <rect x="15" y="10" width="15" height="80" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="2" />
        
        {/* Right Track */}
        <rect x="70" y="10" width="15" height="80" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="2" />
        
        {/* Main Body Chassis */}
        <rect x="25" y="20" width="50" height="60" rx="8" fill={COLORS.robotBody} stroke="#1e293b" strokeWidth="2" />
        
        {/* Front Glass/Chest */}
        <rect x="30" y="30" width="40" height="25" rx="4" fill="#e0f2fe" />
        
        {/* LED Lights inside chest */}
        <circle cx="40" cy="42" r="3" fill="#ef4444" className="animate-pulse" />
        <circle cx="60" cy="42" r="3" fill="#fbbf24" className="animate-pulse" />
        
        {/* Head */}
        <circle cx="50" cy="50" r="12" fill={COLORS.robotHead} stroke="#0ea5e9" strokeWidth="2" />
        
        {/* Eyes */}
        <circle cx="46" cy="48" r="2" fill="white" />
        <circle cx="54" cy="48" r="2" fill="white" />
        
        {/* Direction Arrow (Yellow triangle on top) */}
        <path d="M 50 5 L 60 20 L 40 20 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      </svg>
    </div>
  );
};