import _ from 'lodash';
import { mean, quantile } from 'simple-statistics';

export interface Slice {
  title: string;
  [key: string]: any;
}

export interface SimulationParams {
  slices: Slice[];
  deadlineDate: Date;
  cycleTime: number;
  globalRisk: number;
}

export interface SimulationResult {
  probability: number;
  average: string;
  p90: string;
  expectedDate: Date;
  p90Date: Date;
  sliceCount: number;
  durations: number[];
  deadlineDays: number;
}

export function validateSlices(data: any): Slice[] {
  if (!Array.isArray(data.slices)) {
    throw new Error('JSON must be an array of slices.');
  }

  if (!data.slices.every((s: any) => s.title)) {
    throw new Error('Each slice must have a "title".');
  }

  return data.slices;
}

export function calculateDeliveryDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + Math.ceil(daysFromNow));
  return date;
}

export function calculateDaysFromNow(targetDate: Date): number {
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return Math.ceil(diffDays);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function runSimulation(params: SimulationParams): SimulationResult {
  const { slices, deadlineDate, cycleTime, globalRisk } = params;
  const iterations = 10000;

  // Calculate days until deadline
  const deadlineDays = calculateDaysFromNow(deadlineDate);

  const totalDurations = _.times(iterations, () => {
    return _.sum(slices.map((slice) => {
      const delay = Math.random() < globalRisk;
      return delay ? cycleTime * 1.5 : cycleTime;
    }));
  });

  const metDeadline = totalDurations.filter(d => d <= deadlineDays).length;
  const probability = metDeadline / iterations;
  const averageDuration = mean(totalDurations);
  const p90Duration = quantile(totalDurations, 0.9);

  return {
    probability,
    average: averageDuration.toFixed(2),
    p90: p90Duration.toFixed(2),
    expectedDate: calculateDeliveryDate(averageDuration),
    p90Date: calculateDeliveryDate(p90Duration),
    sliceCount: slices.length,
    durations: totalDurations,
    deadlineDays
  };
}
