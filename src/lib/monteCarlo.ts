
/**
 * Monte Carlo simulation using throughput (slices per week) instead of cycle time
 * @param {Object} params - Simulation parameters
 * @returns {Object} Simulation results
 */
export function monteCarloThroughputSimulation(params: {
    sliceCountMin: number;
    sliceCountMax: number;
    splitFactorMin: number;
    splitFactorMax: number;
    throughputValues: number[];
    throughputMin: number;
    throughputMax: number | null; // Allow null for empty value
    risk: number;
    ignoreRisk: boolean,
    uncertaintyFactor: number;
    startDate: Date;
    deadlineDate: Date;
    iterations?: number;
}) {
    const {
        sliceCountMin,
        sliceCountMax,
        splitFactorMin,
        splitFactorMax,
        throughputValues,
        throughputMin,
        throughputMax,
        uncertaintyFactor,
        risk,
        ignoreRisk,
        startDate,
        deadlineDate,
        iterations = 500
    } = params;

    const deadlineDays = Math.ceil((deadlineDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const completionResults: Record<number, number> = {};
    const totalDurations: number[] = [];

    for (let i = 0; i < iterations; i++) {
        // 1. Randomly select how many slices to build
        const sliceCount = Math.floor(Math.random() * (sliceCountMax - sliceCountMin + 1)) + sliceCountMin;

        // 2. Multiply by random value within split factor range to get total "points"
        const splitFactor = Math.random() * (splitFactorMax - splitFactorMin) + splitFactorMin;
        const totalSlices = sliceCount * splitFactor;

        // 3-5. Calculate total duration based on throughput (slices per week)
        let remainingSlices = totalSlices;
        let weeks = 0;

        while (remainingSlices > 0) {
            // Use either historical throughput or random value between min and max
            let weeklyThroughput;

            if (throughputValues.length > 0) {
                // Select random throughput from historic samples
                const randomIndex = Math.floor(Math.random() * throughputValues.length);
                weeklyThroughput = throughputValues[randomIndex];
            } else if (throughputMax !== null && throughputMax !== undefined) {
                // Generate random throughput between min and max only if throughputMax is provided
                weeklyThroughput = Math.random() * (throughputMax - throughputMin) + throughputMin;
            } else {
                // If throughputMax is empty, just use throughputMin
                weeklyThroughput = throughputMin;
            }

            // Apply uncertainty factor to throughput (only in the negative direction)
            // Generate a random uncertainty reduction between 0 and the uncertainty factor
          const actualRisk = ignoreRisk ? 0 : risk
            const uncertaintyReduction = Math.random() * (uncertaintyFactor+actualRisk);
            weeklyThroughput = weeklyThroughput * (1 - uncertaintyReduction);

            // Process one week's worth of slices
            remainingSlices -= Math.ceil(weeklyThroughput);
            weeks += 1;

            // If we've completed all slices (or more), stop
            if (remainingSlices <= 0) {
                break;
            }
        }

        // Convert weeks to days for consistency
        const totalDuration = Math.ceil(weeks * 7);

        // Record the result
        completionResults[totalDuration] = (completionResults[totalDuration] || 0) + 1;
        totalDurations.push(totalDuration);
    }

    // Sort results for percentile calculations
    totalDurations.sort((a, b) => a - b);

    // Calculate probability of meeting deadline
    const metDeadline = totalDurations.filter(d => d <= deadlineDays).length;
    const probability = metDeadline / iterations;

    // Calculate statistics
    const average = totalDurations.reduce((sum, val) => sum + val, 0) / totalDurations.length;
    const p90 = totalDurations[Math.floor(iterations * 0.9)];

    return {
        probability,
        average: average.toFixed(2),
        p90: p90.toFixed(2),
        expectedDate: calculateDeliveryDate(startDate, average),
        p90Date: calculateDeliveryDate(startDate, p90),
        durations: totalDurations,
        deadlineDays,
        completionResults,
        totalSimulations: iterations
    };
}

// Calculate working days between two dates (excluding weekends)
export const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
    // Clone dates to avoid modifying the originals
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Set to the beginning of the day
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // Ensure start date is before end date
    if (start > end) return 0;

    // Calculate total days (including weekends)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Count weekends
    let weekends = 0;
    const currentDate = new Date(start);

    for (let i = 0; i <= totalDays; i++) {
        const dayOfWeek = currentDate.getDay();
        // 0 is Sunday, 6 is Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekends++;
        }
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Return working days
    return totalDays - weekends;
};

// Calculate delivery date based on days from start date
export const calculateDeliveryDate = (startDate: Date, daysFromStart: number): Date => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.ceil(daysFromStart));
    return date;
};
