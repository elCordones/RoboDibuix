/*
 * RoboDibuix
 * Copyright (C) 2025 David Cordones
 * Licensed under AGPL v3
 */

export const GRID_SIZE = 40; // Size of one grid cell in pixels
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// Starting position (Center of canvas)
export const START_X = CANVAS_WIDTH / 2;
export const START_Y = CANVAS_HEIGHT / 2;
export const START_ANGLE = -90; // Pointing UP

export const ANIMATION_DELAY = 500; // ms between steps

export const COLORS = {
  grid: '#e2e8f0',
  gridDark: '#334155',
  axis: '#94a3b8',
  path: '#0ea5e9',
  robotBody: '#0f172a',
  robotHead: '#38bdf8',
};