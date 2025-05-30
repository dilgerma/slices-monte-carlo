'use client';

import {useEffect, useState} from 'react';
import SimulationGraph from '@/components/SimulationGraph';
import CompletionDistribution from '@/components/CompletionDistribution';
import DetailedResults from '@/components/DetailedResults';
import {monteCarloThroughputSimulation, calculateWorkingDays} from '@/lib/monteCarlo';
import {
    calculateDaysFromNow,
    formatDate,
    formatDateForInput,
    parseJsonSlices,
    parseThroughputValues,
    calculateSliceCountRange
} from '@/lib/utils';
import {useSearchParams} from "next/navigation";
import SliceStatusChart from "@/components/SliceStatusChart";
import {calculateRisk} from "@/lib/risk";

export default function Home() {
    const searchParams = useSearchParams();
    const dataId = searchParams.get('id');
    const debug = searchParams.get('debug')

    const [jsonInput, setJsonInput] = useState('');
    const [slices, setSlices] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [filterSlices, setFilterSlices] = useState<any[]>([])
    const [selectedRelease, setSelectedRelease] = useState<string>()
    const [deadlineDate, setDeadlineDate] = useState<Date>(() => {
        // Default to 30 days from now
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
    });
    // Inside your component:

    useEffect(() => {
        if (dataId) {
            fetch(`/api/data/${dataId}`)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch data');
                    return response.json();
                })
                .then(data => {
                    const jsonValue = JSON.stringify(data)
                    setJsonInput(jsonValue)
                    parseJson(jsonValue)
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                });

        }
    }, [dataId]);

    // Parameters for Monte Carlo simulation
    const [sliceCountMin, setSliceCountMin] = useState(0); // Will be set based on JSON input
    const [sliceCountMax, setSliceCountMax] = useState(0); // Will be set based on JSON input
    const [splitFactorMin, setSplitFactorMin] = useState(1.0);
    const [splitFactorMax, setSplitFactorMax] = useState(1.0);

    // Historical throughput (slices per week)
    const [throughputInput, setThroughputInput] = useState<string>(""); // Slices per week

    const [startDate, setStartDate] = useState<Date>(new Date());

    const [includeDoneSlices, setIncludeDoneSlices] = useState(false)
    const [releases, setReleases] = useState<string[]>([])

    // Throughput range (slices per week)
    const [throughputMin, setThroughputMin] = useState(3); // Minimum slices per week
    const [throughputMax, setThroughputMax] = useState(5); // Maximum slices per week

    // Global uncertainty factor
    const [uncertaintyFactor, setUncertaintyFactor] = useState(0.0);
    const [risk, setRisk] = useState(0.0);
    const [ignoreRisk, setIgnoreRisk] = useState(false);

    const [result, setResult] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const openSlices = slices.filter((it) => includeDoneSlices ? true : it?.status !== "Done")
            .filter(it => groups?.length == 0 ||
                !groups?.some(group => group.slices?.includes(it.title) && group?.exclude))
            .filter(it => selectedRelease ? groups.filter(it => it.targetRelease === selectedRelease)?.flatMap(it => it.slices)?.includes(it.title) : true)

        const calculatedRisk = Number(calculateRisk(openSlices, groups, includeDoneSlices)?.toFixed(2))
        setRisk(calculatedRisk)

        setFilterSlices(openSlices)
        const {min, max} = calculateSliceCountRange(openSlices.length);
        setSliceCountMin(isNaN(min) ? 0 : min);
        setSliceCountMax(max >= min ? max : min);
    }, [includeDoneSlices, slices, groups, selectedRelease,ignoreRisk]);

    const parseJson = (jsonInput: any) => {
        const {slices: slices, error: parseError, sliceGroups: sliceGroups} = parseJsonSlices(jsonInput);
        if (parseError) {
            setError(parseError);
            return;
        }
        setSlices(slices);
        setGroups(sliceGroups)
        setReleases([...new Set(sliceGroups.map(it => it.targetRelease).filter(it => it))])
        const openSlices = slices.filter(it => it?.status !== "Done")
            .filter(it => groups?.length == 0 || !groups?.some(group => group.slices?.includes(it.title) && group?.exclude))
        setFilterSlices(openSlices);

        const calculatedRisk = Number(calculateRisk(openSlices, sliceGroups, includeDoneSlices)?.toFixed(2))
        setRisk(calculatedRisk)

        // Set slice count range based on loaded slices
        const {min, max} = calculateSliceCountRange(openSlices.length);
        setSliceCountMin(min);
        setSliceCountMax(max);

        setError(null);
    };

    const simulateRun = () => {
        try {
            // Parse throughput values (slices per week)
            const throughputValues = parseThroughputValues(throughputInput);

            // Run the Monte Carlo simulation using the imported function
            const simulationResult = monteCarloThroughputSimulation({
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
                deadlineDate
            });

            setResult(simulationResult);
            setError(null);

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
                <h1 className="title">Mona-Slice-Forecasts</h1>
                <p className="subtitle">Predict project completion dates based on slices and historical throughput</p>

                {!filterSlices || filterSlices?.length == 0 || debug ?
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
                        <button className="button is-link mt-2" onClick={() => {
                            parseJson(jsonInput)
                            setSelectedRelease(undefined)
                            setResult(undefined)
                        }}>
                            Load Slices
                        </button>
                        {error && <p className="help is-danger">{error}</p>}
                    </div> : <span/>}

                {filterSlices.length > 0 ? <div className={"columns"}>
                    <div className="column is-4"><SliceStatusChart slices={slices}/></div>
                    <div className={"column"}/>
                    <div className="column is-4"><SliceStatusChart slices={slices} groupByStatus={true}/></div>
                </div> : <span/>}


                {filterSlices.length > 0 && (
                    <>
                        <div className="box">
                            <div className="notification is-info">
                                <p><strong>Loaded Slices:</strong> {filterSlices.length}</p>
                            </div>

                            <div className="columns">

                                <div className="column">
                                    <div className="field">
                                        <label className="label">Start Date</label>
                                        <input
                                            type="date"
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
                                            value={formatDateForInput(deadlineDate)}
                                            onChange={e => setDeadlineDate(new Date(e.target.value))}
                                            min={formatDateForInput(startDate)}
                                        />
                                        <p className="help">Target
                                            date: {formattedDeadlineDate} ({daysUntilDeadline} days from now)</p>
                                        <p className="help">Weeks from now: {(daysUntilDeadline / 7).toFixed(1)}</p>
                                        <p className="help">Working
                                            Days: {calculateWorkingDays(startDate, deadlineDate)}</p>
                                    </div>
                                </div>
                                <div className="column">
                                    <div className="field">
                                        <label className="label">Include Done Slices</label>
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={includeDoneSlices}
                                            onChange={evt => setIncludeDoneSlices(evt.target.checked)}
                                        />
                                    </div>
                                    <div className="field">
                                        <label className="label">Ignore Risk</label>
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={ignoreRisk}
                                            onChange={evt => setIgnoreRisk(evt.target.checked)}
                                        />
                                    </div>
                                    {releases?.length > 0 ? <div className="field">
                                        <label className="label">Target Release</label>
                                        <div className="select">
                                            <select
                                                value={selectedRelease}
                                                    onChange={evt => {
                                                        setSelectedRelease(releases?.includes(evt.target.value)? evt.target.value : undefined)
                                                    }
                                                }
                                            >
                                                <option value="">All Releases</option>
                                                {releases.map((release, index) => (
                                                    <option key={index} value={release}>
                                                        {release}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div> : <span/>}
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
                                <p className="help">Estimate how many slices you might need to build (default: ±10% of
                                    current count)</p>
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
                                <p className="help">Factor to account for slice splitting or complexity (1.0 = no
                                    splitting)</p>
                            </div>

                            <div className="field">
                                <label className="label">Historical Throughput (slices per week,
                                    comma-separated)</label>
                                <input
                                    className="input"
                                    type="text"
                                    value={throughputInput}
                                    onChange={e => setThroughputInput(e.target.value)}
                                    placeholder="comma separated list of weekly throughput"
                                />
                                <p className="help">Enter your teams historical throughput in slices per week</p>
                            </div>

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
                                                step="1"
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
                                                step="1"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className="help">Used when no historical throughput is provided (min and max slices
                                    per week)</p>
                            </div>

                            {/* Global Uncertainty Factor */}
                            <div className="field">
                                <label className="label">Uncertainty Factor (0-1)</label>
                                <input
                                    className="input"
                                    type="number"
                                    value={uncertaintyFactor}
                                    onChange={e => setUncertaintyFactor(Number(e.target.value))}
                                    min="0"
                                    max="1"
                                    step="0.1"
                                />
                                <p className="help">
                                    Reduces throughput by up to this percentage (0 = no reduction, 0.2 = up to 20%
                                    slower).
                                    Higher values represent more pessimistic scenarios.
                                </p>
                            </div>

                            <div className="field">
                                <label className="label">Risk</label>
                                <input
                                    readOnly={true}
                                    className="input"
                                    type="number"
                                    value={risk}
                                    min="0"
                                    max="1"
                                    step="0.05"
                                />
                                <p className="help">
                                    Calculated from the grouped slices and assigned risk.
                                </p>
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
                            <DetailedResults
                                result={result}
                                sliceCountMin={sliceCountMin}
                                sliceCountMax={sliceCountMax}
                                splitFactorMin={splitFactorMin}
                                splitFactorMax={splitFactorMax}
                                throughputMin={throughputMin}
                                throughputMax={throughputMax}
                                uncertaintyFactor={uncertaintyFactor}
                                formattedStartDate={formattedStartDate}
                                formattedDeadlineDate={formattedDeadlineDate}
                                formatDate={formatDate}
                            />
                            <CompletionDistribution
                                completionResults={result.completionResults}
                                totalSimulations={result.totalSimulations}
                                startDate={startDate}
                                deadlineDate={deadlineDate}
                                formatDate={formatDate}
                            />
                        </div>


                    </>
                )}
            </div>
        </section>
    );
}
