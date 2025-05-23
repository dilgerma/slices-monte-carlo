/**
 * Utility functions for date formatting and calculations
 */

// Calculate days until deadline from now
export const calculateDaysFromNow = (targetDate: Date): number => {
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.ceil(diffDays);
};

// Format date for display
export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Format date for input fields
export const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Parse JSON input for slices
export const parseJsonSlices = (jsonInput: string): { forecasts: any[], slices: any[], error: string | null } => {
    try {
        const data = JSON.parse(jsonInput);
        if (!Array.isArray(data.slices)) throw new Error('JSON must be an array of slices.');
        if (!data.slices.every((s: any) => s.title)) throw new Error('Each slice must have a "title".');

        return {
            slices: data.slices,
            forecasts: data.forecasts || [],
            error: null
        };
    } catch (e: any) {
        return {
            forecasts: [],
            slices: [],
            error: e.message
        };
    }
};

// Parse throughput values from comma-separated string
export const parseThroughputValues = (throughputInput: string): number[] => {
    return throughputInput
        .split(',')
        .map(val => parseFloat(val.trim()))
        .filter(val => !isNaN(val));
};

// Calculate slice count range based on loaded slices
export const calculateSliceCountRange = (sliceCount: number): { min: number, max: number } => {
    return {
        min: sliceCount, // 90% of current count as minimum
        max: sliceCount // 110% of current count as maximum
    };
};
