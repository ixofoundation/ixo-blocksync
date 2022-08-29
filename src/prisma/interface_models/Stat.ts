export interface IStat {
    totalServiceProviders: number;
    totalProjects: number;
    totalEvaluationAgents: number;
    totalInvestors: number;
    totalClaims: number;
    successfulClaims: number;
    submittedClaims: number;
    pendingClaims: number;
    rejectedClaims: number;
    claimLocations: string[];
};