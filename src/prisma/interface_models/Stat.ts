export interface IStat {
    totalServiceProviders: number;
    totalProjects: number;
    totalEvaluationAgents: number;
    totalClaims: number;
    successfulClaims: number;
    submittedClaims: number;
    pendingClaims: number;
    rejectedClaims: number;
    claimLocations: string[];
};