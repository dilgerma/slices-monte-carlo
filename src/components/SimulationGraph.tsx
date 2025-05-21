import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface SimulationGraphProps {
    durations: number[];
    deadlineDays: number;
    probability: number;
}

const SimulationGraph = ({ durations, deadlineDays, probability }: SimulationGraphProps) => {
    // Create histogram data from durations
    const createHistogram = () => {
        // Find min and max values
        const min = Math.floor(Math.min(...durations));
        const max = Math.ceil(Math.max(...durations));

        // Create bins (we'll use 15 bins or less if the range is small)
        const binCount = Math.min(15, max - min + 1);
        const binSize = (max - min) / binCount;

        // Initialize bins
        const bins = Array(binCount).fill(0);
        const labels = Array(binCount).fill(0).map((_, i) =>
            Math.round((min + i * binSize + min + (i + 1) * binSize) / 2)
        );

        // Fill bins
        durations.forEach(duration => {
            const binIndex = Math.min(
                Math.floor((duration - min) / binSize),
                binCount - 1
            );
            bins[binIndex]++;
        });

        return { bins, labels };
    };

    const { bins, labels } = createHistogram();

    // Determine status color based on probability
    const getStatusColor = (prob: number) => {
        if (prob >= 0.8) return '#4caf50'; // Green for high probability
        if (prob >= 0.5) return '#ff9800'; // Orange for medium probability
        return '#f44336'; // Red for low probability
    };

    const statusColor = getStatusColor(probability);

    // Create background colors with different color for bins after deadline
    const backgroundColor = labels.map(label =>
        label <= deadlineDays ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'
    );

    // Find the index where the deadline falls
    const deadlineIndex = labels.findIndex(label => label >= deadlineDays);

    const data = {
        labels: labels.map(l => l.toString()),
        datasets: [
            {
                label: 'Distribution of Completion Times',
                data: bins,
                backgroundColor,
                borderColor: labels.map(label =>
                    label <= deadlineDays ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
                ),
                borderWidth: 1,
            }
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Will we meet the deadline?',
                font: {
                    size: 18
                }
            },
            tooltip: {
                callbacks: {
                    title: (items: any[]) => {
                        if (!items.length) return '';
                        const index = items[0].dataIndex;
                        return `Around ${labels[index]} days`;
                    },
                    label: (context: any) => {
                        return `Frequency: ${context.raw} simulations`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Days to Complete'
                },
                grid: {
                    color: (context: any) => {
                        return context.tick.value === deadlineIndex ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)';
                    },
                    lineWidth: (context: any) => {
                        return context.tick.value === deadlineIndex ? 2 : 1;
                    }
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Frequency'
                }
            }
        }
    };

    return (
        <div>
            <div className="columns">
                <div className="column is-one-third">
                    <div className="box has-text-centered" style={{ backgroundColor: statusColor, color: 'white' }}>
                        <h2 className="title is-2" style={{ color: 'white' }}>{(probability * 100).toFixed(0)}%</h2>
                        <p className="subtitle is-5" style={{ color: 'white' }}>Chance of Meeting Deadline</p>
                    </div>
                </div>
                <div className="column">
                    <div className="notification" style={{ backgroundColor: probability >= 0.5 ? '#e8f5e9' : '#ffebee' }}>
                        <p className="is-size-5">
                            <strong>Executive Summary:</strong> Based on {durations.length.toLocaleString()} simulations, we have a
                            <strong> {(probability * 100).toFixed(0)}% chance</strong> of completing this project by the deadline.
                        </p>
                        <p className="mt-2">
                            {probability >= 0.8 ?
                                '✅ We are on track to meet the deadline with high confidence.' :
                                probability >= 0.5 ?
                                    '⚠️ We may meet the deadline, but there are significant risks.' :
                                    '❌ We are unlikely to meet the deadline without changes to scope or resources.'}
                        </p>
                    </div>
                </div>
            </div>

            <Bar data={data} options={options} />
        </div>
    );
};

export default SimulationGraph;
