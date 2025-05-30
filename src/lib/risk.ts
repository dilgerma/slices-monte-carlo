
const findGroupSlices = (slices: any[], group:any, includeDone: boolean): any[] => {
    return group.slices
        .map((it:any) => slices.find(item => item.title == it.title))
        .filter((it:any) => includeDone || it.status !== "Done")

}

/**
 * Calculates the overall risk based on slice groups and their assigned risks
 *
 * @param {Array} slices - Array of all slice objects
 * @param {Array} groups - Array of group objects with risk and slices properties
 * @returns {number} Overall risk score between 0-1
 */
export function calculateRisk(slices:any[], groups:any[], includeDone: boolean) {
    // If no slices, return 0 risk
    if (!slices || slices.length === 0) {
        return 0;
    }


    // Total number of slices
    const totalSliceCount = slices.length;

    // Calculate risk contribution from grouped slices
    let totalRiskContribution = 0;

    // Process each group
    if (groups && Array.isArray(groups)) {
        groups.forEach(group => {
            // Skip groups without risk or slices
            if (group.risk === undefined || !group.slices || !Array.isArray(group.slices) || group.exclude) {
                return;
            }

            // Each slice in the group contributes (group risk / total slices) to the overall risk
            const groupContribution = (findGroupSlices(slices,group,includeDone)?.length * group.risk);
            totalRiskContribution += groupContribution;
        });
    }

    // Return the total risk contribution
    return totalRiskContribution / slices.length;
}
