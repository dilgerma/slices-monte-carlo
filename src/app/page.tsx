'use client';

import { useState } from 'react';
import { mean, quantile } from 'simple-statistics';
import SimulationGraph from '@/components/SimulationGraph';

export default function Home() {
    const [jsonInput, setJsonInput] = useState('');
    const [slices, setSlices] = useState<any[]>([]);
    const [deadlineDate, setDeadlineDate] = useState<Date>(() => {
        // Default to 30 days from now
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
    });

    // Parameters for Monte Carlo simulation
    const [sliceCountMin, setSliceCountMin] = useState(0); // Will be set based on JSON input
    const [sliceCountMax, setSliceCountMax] = useState(0); // Will be set based on JSON input
    const [splitFactorMin, setSplitFactorMin] = useState(1.0);
    const [splitFactorMax, setSplitFactorMax] = useState(1.5);

    // Changed: Historical throughput (slices per week) instead of cycle time
    const [throughputInput, setThroughputInput] = useState('5, 6, 4, 7, 5'); // Slices per week

    const [startDate, setStartDate] = useState<Date>(new Date());

    // New state for slice cycle time (now as throughput)
    const [throughputMin, setThroughputMin] = useState(3); // Minimum slices per week
    const [throughputMax, setThroughputMax] = useState(7); // Maximum slices per week

    const [result, setResult] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const parseJson = () => {
        try {
            const data = JSON.parse(jsonInput);
            if (!Array.isArray(data.slices)) throw new Error('JSON must be an array of slices.');
            if (!data.slices.every((s: any) => s.title)) throw new Error('Each slice must have a "title".');

            const loadedSlices = data.slices;
            setSlices(loadedSlices);

            // Set slice count range based on loaded slices
            const sliceCount = loadedSlices.length;
            setSliceCountMin(Math.max(1, Math.floor(sliceCount * 0.9))); // 90% of current count as minimum
            setSliceCountMax(Math.ceil(sliceCount * 1.1)); // 110% of current count as maximum

            setError(null);
        } catch (e: any) {
            setError(e.message);
        }
    };

    // Calculate days until deadline
    const calculateDaysFromNow = (targetDate: Date): number => {
        const now = new Date();
        const diffTime = targetDate.getTime() - now.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return Math.ceil(diffDays);
    };

    // Format date for display
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format date for input
    const formatDateForInput = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    // Calculate delivery date based on days from now
    const calculateDeliveryDate = (daysFromNow: number): Date => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + Math.ceil(daysFromNow));
        return date;
    };

    const simulateRun = () => {
        try {
            // Parse throughput values (slices per week)
            const throughputValues = throughputInput
                .split(',')
                .map(val => parseFloat(val.trim()))
                .filter(val => !isNaN(val));

            if (throughputValues.length === 0) {
                throw new Error('Please enter at least one valid throughput value');
            }

            const iterations = 500; // As per the rules
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
                    } else {
                        // Generate random throughput between min and max
                        weeklyThroughput = Math.random() * (throughputMax - throughputMin) + throughputMin;
                    }

                    // Process one week's worth of slices
                    remainingSlices -= weeklyThroughput;
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

            // Calculate probability of meeting deadline
            const metDeadline = totalDurations.filter(d => d <= deadlineDays).length;
            const probability = metDeadline / iterations;

            // Calculate statistics
            const averageDuration = mean(totalDurations);
            const p90Duration = quantile(totalDurations, 0.9);

            setResult({
                probability,
                average: averageDuration.toFixed(2),
                p90: p90Duration.toFixed(2),
                expectedDate: calculateDeliveryDate(averageDuration),
                p90Date: calculateDeliveryDate(p90Duration),
                durations: totalDurations,
                deadlineDays,
                completionResults,
                totalSimulations: iterations
            });

        } catch (e: any) {
            setError(e.message);
        }
    };

    // Format the deadline date for display
    const formattedDeadlineDate = formatDate(deadlineDate);
    const formattedStartDate = formatDate(startDate);

    // Calculate days until deadline for display
    const daysUntilDeadline = calculateDaysFromNow(deadlineDate);

    return (
        <section className="section">
            <div className="container">
                <h1 className="title">Monte Carlo Deadline Simulator</h1>
                <p className="subtitle">Predict project completion dates based on slices and historical throughput</p>

                <div className="field">
                    <label className="label">Paste your JSON (array of slices)</label>
                    <div className="control">
            <textarea
                className="textarea"
                rows={10}
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder='{"slices": [{"title": "Slice A"}, {"title": "Slice B"}]}'
            />
                    </div>
                    <button className="button is-link mt-2" onClick={parseJson}>
                        Load Slices
                    </button>
                    {error && <p className="help is-danger">{error}</p>}
                </div>

                {slices.length > 0 && (
                    <>
                        <div className="box">
                            <div className="notification is-info">
                                <p><strong>Loaded Slices:</strong> {slices.length}</p>
                            </div>

                            <div className="columns">
                                <div className="column">
                                    <div className="field">
                                        <label className="label">Start Date</label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={formatDateForInput(startDate)}
                                            onChange={e => setStartDate(new Date(e.target.value))}
                                        />
                                        <p className="help">Project start: {formattedStartDate}</p>
                                    </div>
                                </div>
                                <div className="column">
                                    <div className="field">
                                        <label className="label">Deadline Date</label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={formatDateForInput(deadlineDate)}
                                            onChange={e => setDeadlineDate(new Date(e.target.value))}
                                            min={formatDateForInput(startDate)}
                                        />
                                        <p className="help">Target date: {formattedDeadlineDate} ({daysUntilDeadline} days from now)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Slice Count Range</label>
                                <div className="columns">
                                    <div className="column">
                                        <div className="field">
                                            <label className="label is-small">Minimum</label>
                                            <input
                                                className="input"
                                                type="number"
                                                value={sliceCountMin}
                                                onChange={e => setSliceCountMin(Number(e.target.value))}
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                    <div className="column">
                                        <div className="field">
                                            <label className="label is-small">Maximum</label>
                                            <input
                                                className="input"
                                                type="number"
                                                value={sliceCountMax}
                                                onChange={e => setSliceCountMax(Number(e.target.value))}
                                                min={sliceCountMin}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="help">Estimate how many slices you might need to build (default: ±10% of current count)</p>
                            </div>

                            <div className="field">
                                <label className="label">Slice Split Factor Range</label>
                                <div className="columns">
                                    <div className="column">
                                        <div className="field">
                                            <label className="label is-small">Minimum</label>
                                            <input
                                                className="input"
                                                type="number"
                                                value={splitFactorMin}
                                                onChange={e => setSplitFactorMin(Number(e.target.value))}
                                                min="0.1"
                                                step="0.1"
                                            />
                                        </div>
                                    </div>
                                    <div className="column">
                                        <div className="field">
                                            <label className="label is-small">Maximum</label>
                                            <input
                                                className="input"
                                                type="number"
                                                value={splitFactorMax}
                                                onChange={e => setSplitFactorMax(Number(e.target.value))}
                                                min={splitFactorMin}
                                                step="0.1"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="help">Factor to account for slice splitting or complexity (1.0 = no splitting)</p>
                            </div>

                            <div className="field">
                                <label className="label">Historical Throughput (slices per week, comma-separated)</label>
                                <input
                                    className="input"
                                    type="text"
                                    value={throughputInput}
                                    onChange={e => setThroughputInput(e.target.value)}
                                    placeholder="5, 6, 4, 7, 5"
                                />
                                <p className="help">Enter your team's historical throughput in slices per week</p>
                            </div>

                            {/* New section for throughput range */}
                            <div className="field">
                                <label className="label">Throughput Range (slices per week)</label>
                                <div className="columns">
                                    <div className="column">
                                        <div className="field">
                                            <label className="label is-small">Minimum</label>
                                            <input
                                                className="input"
                                                type="number"
                                                value={throughputMin}
                                                onChange={e => setThroughputMin(Number(e.target.value))}
                                                min="0.1"
                                                step="0.1"
                                            />
                                        </div>
                                    </div>
                                    <div className="column">
                                        <div className="field">
                                            <label className="label is-small">Maximum</label>
                                            <input
                                                className="input"
                                                type="number"
                                                value={throughputMax}
                                                onChange={e => setThroughputMax(Number(e.target.value))}
                                                min={throughputMin}
                                                step="0.1"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="help">Used when no historical throughput is provided (min and max slices per week)</p>
                            </div>
                        </div>

                        <button className="button is-primary" onClick={simulateRun}>
                            Run Simulation
                        </button>
                    </>
                )}

                {result && (
                    <>
                        <div className="box mt-4">
                            <SimulationGraph
                                durations={result.durations}
                                deadlineDays={result.deadlineDays}
                                probability={result.probability}
                                completionResults={result.completionResults}
                                totalSimulations={result.totalSimulations}
                            />

                            <div className="mt-4">
                                <h3 className="subtitle">Completion Distribution</h3>
                                <div className="table-container">
                                    <table className="table is-fullwidth">
                                        <thead>
                                        <tr>
                                            <th>Days</th>
                                            <th>Weeks</th>
                                            <th>Completion Date</th>
                                            <th>Count</th>
                                            <th>Percentage</th>
                                            <th>Cumulative %</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {Object.keys(result.completionResults)
                                            .sort((a, b) => parseInt(a) - parseInt(b))
                                            .map((days, index, array) => {
                                                const daysNum = parseInt(days);
                                                const weeksNum = (daysNum / 7).toFixed(1);
                                                const count = result.completionResults[daysNum];
                                                const percentage = (count / result.totalSimulations) * 100;
                                                const cumulativeCount = array
                                                    .slice(0, index + 1)
                                                    .reduce((sum, d) => sum + result.completionResults[parseInt(d)], 0);
                                                const cumulativePercentage = (cumulativeCount / result.totalSimulations) * 100;

                                                // Calculate completion date
                                                const completionDate = new Date(startDate);
                                                completionDate.setDate(completionDate.getDate() + daysNum);

                                                // Determine if this is past the deadline
                                                const isPastDeadline = completionDate > deadlineDate;

                                                return (
                                                    <tr key={days} className={isPastDeadline ? "has-background-danger-light" : ""}>
                                                        <td>{days}</td>
                                                        <td>{weeksNum}</td>
                                                        <td>{formatDate(completionDate)}</td>
                                                        <td>{count}</td>
                                                        <td>{percentage.toFixed(1)}%</td>
                                                        <td>{cumulativePercentage.toFixed(1)}%</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="notification is-info mt-4">
                            <h3 className="subtitle">Detailed Results</h3>
                            <div className="columns">
                                <div className="column">
                                    <p><strong>Slice Count Range:</strong> {sliceCountMin} - {sliceCountMax}</p>
                                    <p><strong>Slice Split Factor:</strong> {splitFactorMin} - {splitFactorMax}</p>
                                    <p><strong>Team Throughput:</strong> {throughputMin} - {throughputMax} slices/week</p>
                                </div>
                                <div className="column">
                                    <p><strong>Start Date:</strong> {formattedStartDate}</p>
                                    <p><strong>Deadline:</strong> {formattedDeadlineDate} ({result.deadlineDays} days from start)</p>
                                    <p><strong>Probability to Meet Deadline:</strong> {(result.probability * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                            <hr />
                            <div className="columns">
                                <div className="column">
                                    <p><strong>Average Completion Time:</strong> {result.average} days ({(parseFloat(result.average) / 7).toFixed(1)} weeks)</p>
                                    <p><strong>90th Percentile Time:</strong> {result.p90} days ({(parseFloat(result.p90) / 7).toFixed(1)} weeks)</p>
                                </div>
                                <div className="column">
                                    <p><strong>Expected Delivery Date:</strong> {formatDate(result.expectedDate)}</p>
                                    <p><strong>90% Confidence Delivery Date:</strong> {formatDate(result.p90Date)}</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

