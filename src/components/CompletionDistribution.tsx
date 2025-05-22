'use client';

import React from 'react';
import { calculateDeliveryDate } from '@/lib/monteCarlo';

interface CompletionDistributionProps {
  completionResults: Record<number, number>;
  totalSimulations: number;
  startDate: Date;
  deadlineDate: Date;
  formatDate: (date: Date) => string;
}

const CompletionDistribution: React.FC<CompletionDistributionProps> = ({
  completionResults,
  totalSimulations,
  startDate,
  deadlineDate,
  formatDate
}) => {
  return (
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
            {Object.keys(completionResults)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map((days, index, array) => {
                const daysNum = parseInt(days);
                const weeksNum = (daysNum / 7).toFixed(1);
                const count = completionResults[daysNum];
                const percentage = (count / totalSimulations) * 100;
                const cumulativeCount = array
                  .slice(0, index + 1)
                  .reduce((sum, d) => sum + completionResults[parseInt(d)], 0);
                const cumulativePercentage = (cumulativeCount / totalSimulations) * 100;

                // Calculate completion date
                const completionDate = calculateDeliveryDate(startDate, daysNum);

                // Determine if this is past the deadline
                const isPastDeadline = completionDate > deadlineDate;

                return (
                  <tr key={days} className={isPastDeadline ? "has-background-danger" : ""}>
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
  );
};

export default CompletionDistribution;
