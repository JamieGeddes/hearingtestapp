export interface TestResult {
  volume: number;
  responseTime: number | null;
  decibelLevel: number;
  noResponse?: boolean;
}

export interface TestResults {
  left: Record<number, TestResult>;
  right: Record<number, TestResult>;
}

export type EarType = 'left' | 'right' | 'both';

export type HearingStatus = 'normal' | 'mild' | 'moderate' | 'severe' | 'profound';

export interface AudioNodes {
  oscillator: OscillatorNode;
  gainNode: GainNode;
}

export interface HearingTestElements {
  setupScreen: HTMLElement;
  testScreen: HTMLElement;
  resultsScreen: HTMLElement;
  volumeTestBtn: HTMLButtonElement;
  startTestBtn: HTMLButtonElement;
  hearButton: HTMLButtonElement;
  restartBtn: HTMLButtonElement;
  saveResultsBtn: HTMLButtonElement;
  currentEarDisplay: HTMLElement;
  currentFrequencyDisplay: HTMLElement;
  testProgressDisplay: HTMLElement;
  progressFill: HTMLElement;
  volumeLevel: HTMLElement;
  statusText: HTMLElement;
  resultsChart: HTMLCanvasElement;
  leftEarSummary: HTMLElement;
  rightEarSummary: HTMLElement;
  detailedTable: HTMLElement;
}

export type ScreenType = 'setup' | 'test' | 'results';