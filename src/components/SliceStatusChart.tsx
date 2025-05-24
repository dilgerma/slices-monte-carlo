import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register the required Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Define the SliceStatus enum to match your existing code
enum SliceStatus {
    Done = "Done",
    Assigned = "Assigned",
    Planned = "Planned",
    Review = "Review",
    Blocked = "Blocked",
    Created = "Created"
}

interface Slice {
    title: string;
    status: SliceStatus | string;
    // Add other properties as needed
}

interface SliceStatusChartProps {
    slices: Slice[];
    groupByStatus?: boolean; // Optional flag to control grouping behavior
}

// Define colors based on the calculateSliceStatus function
const statusColors: Record<string, { bg: string, border: string }> = {
    [SliceStatus.Done]: { bg: '#90ee90', border: '#7bc47b' },
    [SliceStatus.Assigned]: { bg: '#d3d3d3', border: '#b3b3b3' },
    [SliceStatus.Planned]: { bg: '#cccc00', border: '#aaaa00' },
    [SliceStatus.Review]: { bg: '#ffb6c1', border: '#e09aa5' },
    [SliceStatus.Blocked]: { bg: '#ff0000', border: '#cc0000' },
    [SliceStatus.Created]: { bg: '#add8e6', border: '#8fb8c6' }, // Light blue as default
    'Other': { bg: '#ffc107', border: '#d9a406' } // Fallback for any other status
};

const SliceStatusChart: React.FC<SliceStatusChartProps> = ({ slices, groupByStatus = false }) => {
    const chartData = useMemo(() => {
        if (groupByStatus) {
            // Group by all statuses
            const statusCounts: Record<string, number> = {};

            // Count slices by each status
            slices.forEach(slice => {
                const status = slice.status || SliceStatus.Created;
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            });

            // Convert to arrays for chart.js
            const labels = Object.keys(statusCounts);
            const data = labels.map(label => statusCounts[label]);

            // Generate colors for each status
            const backgroundColor = labels.map(label =>
                statusColors[label]?.bg || statusColors['Other'].bg
            );
            const borderColor = labels.map(label =>
                statusColors[label]?.border || statusColors['Other'].border
            );

            return {
                labels,
                datasets: [
                    {
                        data,
                        backgroundColor,
                        borderColor,
                        borderWidth: 1,
                    },
                ],
            };
        } else {
            // Simple Done vs. Others grouping
            const doneCount = slices.filter(slice => slice.status === SliceStatus.Done).length;
            const otherCount = slices.length - doneCount;

            return {
                labels: ['Done', 'In Progress/Not Started'],
                datasets: [
                    {
                        data: [doneCount, otherCount],
                        backgroundColor: [statusColors[SliceStatus.Done].bg, '#ffc107'],
                        borderColor: [statusColors[SliceStatus.Done].border, '#d9a406'],
                        borderWidth: 1,
                    },
                ],
            };
        }
    }, [slices, groupByStatus]);

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = slices.length;
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
    };

    // If there are no slices, show a message
    if (slices.length === 0) {
        return <div className="text-center p-4">No slices to display</div>;
    }

    // Calculate completion stats
    const doneCount = slices.filter(slice => slice.status === SliceStatus.Done).length;
    const completionRate = Math.round((doneCount / slices.length) * 100);

    return (
        <div className="w-full max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-center">
                Slice Status Distribution
            </h3>

            <div className="w-64 h-64 mx-auto">
                <Pie data={chartData} options={options} />
            </div>
            {!groupByStatus ? <div className="mt-4 text-center text-sm text-gray-600">
                Total Slices: {slices.length} | Completed: {doneCount} |
                Completion Rate: {completionRate}%
            </div> : <span/>}

            {/* Add a legend to show all status colors */}
            {groupByStatus && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {Object.entries(SliceStatus).map(([_, status]) => (
                        <div key={status} className="flex items-center">
                            <div
                                className="w-4 h-4 mr-2 rounded-full"
                                style={{ backgroundColor: statusColors[status]?.bg }}
                            ></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SliceStatusChart;
