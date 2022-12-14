import { readFileSync } from "fs";
import { prisma } from "../prisma/prisma_client";
import { getIid } from "../util/proto";

const chains = JSON.parse(
    readFileSync("src/seed/json_exports/chains.json").toString(),
);
const dids = JSON.parse(
    readFileSync("src/seed/json_exports/dids.json").toString(),
);
const projects = JSON.parse(
    readFileSync("src/seed/json_exports/projects.json").toString(),
);

const seedChains = async () => {
    for (const chain of chains) {
        await prisma.chain.create({
            data: {
                chainId: chain.chainId,
                blockHeight: chain.blockHeight,
            },
        });
    }
};
// seedChains();

const seedDids = async () => {
    try {
        for (const did of dids) {
            const iid = await getIid(did.did);
            await prisma.iID.create({
                data: {
                    id: String(iid?.id),
                    updated: new Date(),
                    created: new Date(),
                    Controller: iid?.controller,
                    Context: JSON.stringify(iid?.context),
                },
            });
            if (iid?.verificationMethod) {
                for (const verificationMethod of iid.verificationMethod) {
                    await prisma.verificationMethod.create({
                        data: {
                            id: verificationMethod.id,
                            iid: iid.id,
                            relationships: "",
                            type: verificationMethod.type,
                            controller: verificationMethod.controller,
                            verificationMaterial:
                                verificationMethod.blockchainAccountID ||
                                verificationMethod.publicKeyHex ||
                                verificationMethod.publicKeyMultibase ||
                                verificationMethod.publicKeyBase58 ||
                                "",
                        },
                    });
                }
            }
            if (iid?.service) {
                for (const service of iid.service) {
                    await prisma.service.create({
                        data: {
                            id: service.id,
                            iid: iid.id,
                            type: service.type,
                            serviceEndpoint: service.serviceEndpoint,
                        },
                    });
                }
            }
            if (iid?.accordedRight) {
                for (const accordedRight of iid.accordedRight) {
                    await prisma.accordedRight.create({
                        data: {
                            id: accordedRight.id,
                            iid: iid.id,
                            type: accordedRight.type,
                            mechanism: accordedRight.mechanism,
                            service: accordedRight.service,
                        },
                    });
                }
            }
            if (iid?.linkedResource) {
                for (const linkedResource of iid.linkedResource) {
                    await prisma.linkedResource.create({
                        data: {
                            id: linkedResource.id,
                            iid: iid.id,
                            type: linkedResource.type,
                            description: linkedResource.description,
                            mediaType: linkedResource.mediaType,
                            serviceEndpoint: linkedResource.serviceEndpoint,
                            proof: linkedResource.proof,
                            encrypted: linkedResource.encrypted,
                            right: linkedResource.right,
                        },
                    });
                }
            }
            if (iid?.linkedEntity) {
                for (const linkedEntity of iid.linkedEntity) {
                    await prisma.linkedEntity.create({
                        data: {
                            id: linkedEntity.id,
                            iid: iid.id,
                            relationship: linkedEntity.relationship,
                        },
                    });
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
};
// seedDids();

const seedProjects = async () => {
    try {
        projects.forEach(async (project) => {
            await prisma.project.create({
                data: {
                    projectDid: project.projectDid,
                    txHash: project.txHash,
                    senderDid: project.senderDid,
                    pubKey: project.pubKey,
                    data: JSON.stringify(project.data),
                    projectAddress: "",
                    status: project.status,
                    entityType: "",
                    createdOn:
                        new Date(
                            Number(project.data.createdOn.$date.$numberLong),
                        ) || new Date(),
                    createdBy: project.data.createdBy,
                    successfulClaims: project.data.claimStats.currentSuccessful,
                    rejectedClaims: project.data.claimStats.currentRejected,
                    evaluators: project.data.agentStats.evaluators,
                    evaluatorsPending:
                        project.data.agentStats.evaluatorsPending,
                    serviceProviders: project.data.agentStats.serviceProviders,
                    serviceProvidersPending:
                        project.data.agentStats.serviceProvidersPending,
                    investors: project.data.agentStats.investors,
                    investorsPending: project.data.agentStats.investorsPending,
                },
            });
        });
    } catch (error) {
        console.log(error);
    }
};
// seedProjects();
