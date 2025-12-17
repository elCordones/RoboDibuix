/*
 * RoboDibuix
 * Copyright (C) 2025 David Cordones
 * Licensed under AGPL v3
 */

export enum CommandType {
  FORWARD = 'FORWARD',
  BACKWARD = 'BACKWARD',
  TURN_RIGHT = 'TURN_RIGHT',
  TURN_LEFT = 'TURN_LEFT',
  REPEAT = 'REPEAT',
}

export interface Command {
  id: string;
  type: CommandType;
  value: number;
  children?: Command[]; // For nested commands in REPEAT
}

export interface RobotState {
  x: number;
  y: number;
  angle: number; // In degrees, 0 points East (Right)
  penDown: boolean;
}

export interface Point {
  x: number;
  y: number;
}