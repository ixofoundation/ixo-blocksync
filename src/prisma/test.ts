import { prisma } from "./prisma_client";

async function main() {
    const stat = await prisma.stat.create({
        data: {
            totalServiceProviders: 0,
            totalProjects: 0,
            totalEvaluationAgents: 0,
            totalInvestors: 0,
            totalClaims: 0,
            successfulClaims: 0,
            submittedClaims: 0,
            pendingClaims: 0,
            rejectedClaims: 0,
            claimLocations: [""],
        }
    })
    console.log(stat.id);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })