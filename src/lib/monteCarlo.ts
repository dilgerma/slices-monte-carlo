/**
 * Monte Carlo simulation to forecast completion time based on cycle times
 * @param {number[]} cycleTimeData - Historical cycle times (days per slice)
 * @param {number} sliceCountMin - Minimum number of slices
 * @param {number} sliceCountMax - Maximum number of slices
 * @param {number} splitFactorMin - Minimum split factor
 * @param {number} splitFactorMax - Maximum split factor
 * @param {number} simulations - Number of simulations to run
 * @returns {Object} Forecast results with percentiles
 */
export function monteCarloForecastCompletionTime(
    cycleTimeData: number[],
    sliceCountMin: number,
    sliceCountMax: number,
    splitFactorMin = 1.0,
    splitFactorMax = 1.5,
    simulations = 500
) {
  if (!cycleTimeData || cycleTimeData.length === 0) {
    throw new Error('Cycle time data is required');
  }

  const results: number[] = [];
  const completionResults: { [key: number]: number } = {};

  for (let i = 0; i < simulations; i++) {
    // 1. Randomly select how many slices to build
    const sliceCount = Math.floor(Math.random() * (sliceCountMax - sliceCountMin + 1)) + sliceCountMin;

    // 2. Apply random split factor to get total slices
    const splitFactor = Math.random() * (splitFactorMax - splitFactorMin) + splitFactorMin;
    const totalSlices = sliceCount * splitFactor;

    // 3. Calculate total duration based on cycle times
    let totalDuration = 0;
    let remainingSlices = totalSlices;

    while (remainingSlices > 0) {
      // Select random cycle time from historic samples
      const randomIndex = Math.floor(Math.random() * cycleTimeData.length);
      const cycleTime = cycleTimeData[randomIndex];

      // Process one slice
      totalDuration += cycleTime;
      remainingSlices -= 1;
    }

    // Round to nearest day
    totalDuration = Math.ceil(totalDuration);

    // Record the result
    results.push(totalDuration);
    completionResults[totalDuration] = (completionResults[totalDuration] || 0) + 1;
  }

  // Sort results for percentile calculations
  results.sort((a, b) => a - b);

  return {
    p50: results[Math.floor(simulations * 0.50)],
    p85: results[Math.floor(simulations * 0.85)],
    p95: results[Math.floor(simulations * 0.95)],
    raw: results,
    completionResults
  };
}

/**
 * Monte Carlo simulation to forecast scope (how many slices can be completed)
 * @param {number[]} cycleTimeData - Historical cycle times (days per slice)
 * @param {number} availableDays - Number of available days
 * @param {number} splitFactorMin - Minimum split factor
 * @param {number} splitFactorMax - Maximum split factor
 * @param {number} simulations - Number of simulations to run
 * @returns {Object} Forecast results with percentiles
 */
export function monteCarloForecastScope(
    cycleTimeData,
    availableDays,
    splitFactorMin = 1.0,
    splitFactorMax = 1.5,
    simulations = 500
) {
  if (!cycleTimeData || cycleTimeData.length === 0) {
    throw new Error('Cycle time data is required');
  }

  const results:number[] = [];
  const scopeResults = {};

  for (let i = 0; i < simulations; i++) {
    let totalDaysUsed = 0;
    let slicesCompleted = 0;

    // Keep adding slices until we run out of time
    while (totalDaysUsed < availableDays) {
      // Select random cycle time from historic samples
      const randomIndex = Math.floor(Math.random() * cycleTimeData.length);
      const cycleTime = cycleTimeData[randomIndex];

      // Check if we can complete another slice
      if (totalDaysUsed + cycleTime <= availableDays) {
        totalDaysUsed += cycleTime;
        slicesCompleted += 1;
      } else {
        break;
      }
    }

    // Apply inverse split factor to get "real" slices
    const splitFactor = Math.random() * (splitFactorMax - splitFactorMin) + splitFactorMin;
    const adjustedSlices = Math.floor(slicesCompleted / splitFactor);

    // Record the result
    results.push(adjustedSlices);
    scopeResults[adjustedSlices] = (scopeResults[adjustedSlices] || 0) + 1;
  }

  // Sort results for percentile calculations
  results.sort((a, b) => a - b);

  return {
    p50: results[Math.floor(simulations * 0.50)],
    p85: results[Math.floor(simulations * 0.85)],
    p95: results[Math.floor(simulations * 0.95)],
    raw: results,
    scopeResults
  };
}
