export interface IStats {
    totalServiceProviders: number,
    totalProjects: number,
    totalEvaluationAgents: number,
    claims: IClaims
}

interface IClaims {
    total: number,
    totalSuccesul: number,
    totalSubmitted: number,
    totalPending: number,
    totalRejected: number,
    claimLocations: ILocations[]
}

interface ILocations {
    long: string,
    lat: string
}