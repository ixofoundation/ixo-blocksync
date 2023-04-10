// import { readFileSync } from "fs";
// import { prisma } from "../prisma/prisma_client";
// import { Prisma } from "@prisma/client";
// import { getIid } from "../util/proto";

// let agentsErrors = 0;
// const seedAgents = async () => {
//   try {
//     const projects = JSON.parse(
//       readFileSync("src/seed/json_exports/projects.json").toString()
//     );
//     for (const project of projects) {
//       for (const agent of project.data.agents) {
//         try {
//           await prisma.agent.create({
//             data: {
//               agentDid: agent.did,
//               projectDid: project.projectDid,
//               status: agent.status,
//               role: agent.role,
//             },
//           });
//         } catch (error) {
//           console.error(error);
//           agentsErrors++;
//         }
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     agentsErrors++;
//   }
// };

// let alphaErrors = 0;
// const seedAlphas = async () => {
//   try {
//     const alphas = JSON.parse(
//       readFileSync("src/seed/json_exports/alphas.json").toString()
//     );
//     for (const alpha of alphas) {
//       try {
//         const rawValue = JSON.parse(alpha.raw_value);
//         await prisma.alpha.create({
//           data: {
//             bondDid: alpha.bond_did,
//             alpha: rawValue.value.alpha,
//             height: alpha.height,
//             timestamp: alpha.timestamp,
//             delta: "",
//             oracleDid: "",
//             oracleAddress: "",
//           },
//         });
//       } catch (error) {
//         console.error(error);
//         alphaErrors++;
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     alphaErrors++;
//   }
// };

// let bondsErrors = 0;
// const seedBonds = async () => {
//   try {
//     const bonds = JSON.parse(
//       readFileSync("src/seed/json_exports/bonds.json").toString()
//     );
//     for (const bond of bonds) {
//       try {
//         await prisma.bond.create({
//           data: {
//             bondDid: bond.did,
//             token: bond.token,
//             name: bond.name,
//             description: bond.description,
//             creatorDid: bond.creatorDid,
//             status: "",
//             functionType: "",
//             controllerDid: "",
//             reserveTokens: [""],
//             txFeePercentage: "",
//             exitFeePercentage: "",
//             feeAddress: "",
//             reserveWithdrawalAddress: "",
//             sanityRate: "",
//             sanityMarginPercentage: "",
//             allowSells: true,
//             allowReserveWithdrawals: true,
//             alphaBond: true,
//             batchBlocks: "",
//             creatorAddress: "",
//           },
//         });
//         for (const priceEntry of bond.priceHistory) {
//           await prisma.priceEntry.create({
//             data: {
//               bondDid: bond.did,
//               time: new Date(Number(priceEntry.time.$date.$numberLong)),
//               denom: "",
//               price: new Prisma.Decimal(priceEntry.price),
//             },
//           });
//         }
//       } catch (error) {
//         console.error(error);
//         bondsErrors++;
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     bondsErrors++;
//   }
// };

// let chainsErrors = 0;
// const seedChains = async () => {
//   try {
//     const chains = JSON.parse(
//       readFileSync("src/seed/json_exports/chains.json").toString()
//     );
//     for (const chain of chains) {
//       try {
//         await prisma.chain.create({
//           data: {
//             chainId: chain.chainId,
//             blockHeight: chain.blockHeight,
//           },
//         });
//       } catch (error) {
//         console.error(error);
//         chainsErrors++;
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     chainsErrors++;
//   }
// };

// let claimsErrors = 0;
// const seedClaims = async () => {
//   try {
//     const projects = JSON.parse(
//       readFileSync("src/seed/json_exports/projects.json").toString()
//     );
//     for (const project of projects) {
//       if (project.data.claims != undefined) {
//         for (const claim of project.data.claims) {
//           try {
//             if (claim.claimId && claim.claimTemplateId && claim.status) {
//               await prisma.claim.create({
//                 data: {
//                   claimId: claim.claimId,
//                   projectDid: project.projectDid,
//                   claimTemplateId: claim.claimTemplateId,
//                   status: claim.status,
//                 },
//               });
//             }
//           } catch (error) {
//             console.error(error);
//             claimsErrors++;
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     claimsErrors++;
//   }
// };

// let didsErrors = 0;
// const seedDids = async () => {
//   try {
//     const dids = JSON.parse(
//       readFileSync("src/seed/json_exports/dids.json").toString()
//     );
//     for (const did of dids) {
//       try {
//         const iid = await getIid(did.did);
//         if (iid) {
//           const contextArr: Prisma.ContextUncheckedCreateInput[] = [];
//           for (const c of iid.context) {
//             contextArr.push({
//               iid: iid.id,
//               key: c.key,
//               val: c.val,
//             });
//           }
//           await prisma.iID.create({
//             data: {
//               id: iid.id,
//               publicKey: did.publicKey,
//               controller: iid.controller || [],
//               verificationMethod: JSON.stringify(iid.verificationMethod) || "",
//               authentication: iid.authentication || "",
//               assertionMethod: iid.assertionMethod || "",
//               keyAgreement: iid.keyAgreement || [],
//               capabilityInvocation: iid.capabilityInvocation || "",
//               capabilityDelegation: iid.capabilityDelegation || "",
//               alsoKnownAs: iid.alsoKnownAs || "",
//               metadata: JSON.stringify(iid.metadata) || "",
//             },
//           });
//           for (const s of iid.service) {
//             await prisma.service.create({
//               data: {
//                 iid: iid.id,
//                 ...s,
//               },
//             });
//           }
//           for (const r of iid.linkedResource) {
//             await prisma.linkedResource.create({
//               data: {
//                 iid: iid.id,
//                 ...r,
//               },
//             });
//           }
//           for (const a of iid.accordedRight) {
//             await prisma.accordedRight.create({
//               data: {
//                 iid: iid.id,
//                 ...a,
//               },
//             });
//           }
//           for (const e of iid.linkedEntity) {
//             await prisma.linkedEntity.create({
//               data: {
//                 iid: iid.id,
//                 ...e,
//               },
//             });
//           }
//           await prisma.context.createMany({ data: contextArr });
//         }
//       } catch (error) {
//         console.error(error);
//         didsErrors++;
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     didsErrors++;
//   }
// };

// let eventsErrors = 0;
// const seedEvents = async () => {
//   try {
//     const events = JSON.parse(
//       readFileSync("src/seed/json_exports/events.json").toString()
//     );
//     for (const event of events) {
//       try {
//         await prisma.event.create({
//           data: {
//             type: event.type,
//             attributes: event.attributes,
//             blockHeight: event.context.blockHeight,
//             timestamp: new Date(Number(event.context.$date.$numberLong)),
//           },
//         });
//       } catch (error) {
//         console.error(error);
//         eventsErrors++;
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     eventsErrors++;
//   }
// };

// let paymentoutcomesErrors = 0;
// const seedPaymentOutcomes = async () => {
//   try {
//     const paymentOutcomes = JSON.parse(
//       readFileSync("src/seed/json_exports/paymentoutcomes.json").toString()
//     );
//     for (const paymentOutcome of paymentOutcomes) {
//       try {
//         const rawValue = JSON.parse(paymentOutcome.raw_value);
//         await prisma.outcomePayment.create({
//           data: {
//             bondDid: paymentOutcome.bond_did.slice(1, -1),
//             senderDid: paymentOutcome.sender_did.slice(1, -1),
//             amount: rawValue.msg[0].value.amount.slice(1, -1),
//             height: paymentOutcome.height,
//             timestamp: paymentOutcome.timestamp,
//             senderAddress: "",
//           },
//         });
//       } catch (error) {
//         console.error(error);
//         paymentoutcomesErrors++;
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     paymentoutcomesErrors++;
//   }
// };

// let projectsErrors = 0;
// const seedProjects = async () => {
//   try {
//     const projects = JSON.parse(
//       readFileSync("src/seed/json_exports/projects.json").toString()
//     );
//     for (const project of projects) {
//       try {
//         let createdOn: Date | string;
//         if (project.data.createdOn.$date === undefined) {
//           createdOn = project.data.createdOn.toString();
//         } else {
//           createdOn = new Date(
//             Number(project.data.createdOn["$date"]["$numberLong"])
//           );
//         }
//         await prisma.project.create({
//           data: {
//             projectDid: project.projectDid,
//             txHash: project.txHash,
//             senderDid: project.senderDid,
//             pubKey: project.pubKey,
//             data: JSON.stringify(project.data),
//             projectAddress: "",
//             status: project.status,
//             entityType: "",
//             createdOn: createdOn,
//             createdBy: project.data.createdBy,
//             successfulClaims: project.data.claimStats
//               ? project.data.claimStats.currentSuccessful
//               : 0,
//             rejectedClaims: project.data.claimStats
//               ? project.data.claimStats.currentRejected
//               : 0,
//             evaluators: project.data.agentStats
//               ? project.data.agentStats.evaluators
//               : 0,
//             evaluatorsPending: project.data.agentStats
//               ? project.data.agentStats.evaluatorsPending
//               : 0,
//             serviceProviders: project.data.agentStats
//               ? project.data.agentStats.serviceProviders
//               : 0,
//             serviceProvidersPending: project.data.agentStats
//               ? project.data.agentStats.serviceProvidersPending
//               : 0,
//             investors: project.data.agentStats
//               ? project.data.agentStats.investors
//               : 0,
//             investorsPending: project.data.agentStats
//               ? project.data.agentStats.investorsPending
//               : 0,
//           },
//         });
//       } catch (error) {
//         console.error(error);
//         projectsErrors++;
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     projectsErrors++;
//   }
// };

// let statsErrors = 0;
// const seedStats = async () => {
//   try {
//     const stats = JSON.parse(
//       readFileSync("src/seed/json_exports/stats.json").toString()
//     );
//     for (const stat of stats) {
//       try {
//         await prisma.stats.create({
//           data: {
//             totalServiceProviders: stat.totalServiceProviders,
//             totalProjects: stat.totalProjects,
//             totalEvaluationAgents: stat.totalEvaluationAgents,
//             totalClaims: stat.claims.total,
//             successfulClaims: stat.claims.totalSuccessful,
//             submittedClaims: stat.claims.totalSubmitted,
//             pendingClaims: stat.claims.totalPending,
//             rejectedClaims: stat.claims.totalRejected,
//             claimLocations: stat.claims.claimLocations || [""],
//             totalInvestors: 0,
//           },
//         });
//       } catch (error) {
//         console.error(error);
//         statsErrors++;
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     statsErrors++;
//   }
// };

// let transactionsErrors = 0;
// const seedTransactions = async () => {
//   try {
//     const transactions = JSON.parse(
//       readFileSync("src/seed/json_exports/transactions.json").toString()
//     );
//     for (const transaction of transactions) {
//       try {
//         const amount = JSON.parse(transaction.amount);
//         await prisma.bondBuy.create({
//           data: {
//             bondDid: transaction.bond_did.slice(1, -1),
//             buyerDid: transaction.buyer_did.slice(1, -1),
//             amount: amount.amount,
//             maxPrices: transaction.max_prices,
//             buyerAddress: "",
//           },
//         });
//       } catch (error) {
//         console.error(error);
//         transactionsErrors++;
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     transactionsErrors++;
//   }
// };

// let withdrawreservesErrors = 0;
// const seedWithdrawReserves = async () => {
//   try {
//     const withdrawReserves = JSON.parse(
//       readFileSync("src/seed/json_exports/withdrawreserves.json").toString()
//     );
//     for (const withdrawReserve of withdrawReserves) {
//       try {
//         const rawValue = JSON.parse(withdrawReserve.raw_value);
//         await prisma.reserveWithdrawal.create({
//           data: {
//             bondDid: withdrawReserve.bond_did,
//             withdrawerDid: withdrawReserve.withdrawer_did,
//             amount: rawValue.value.amount,
//             height: withdrawReserve.height,
//             timestamp: withdrawReserve.timestamp,
//             withdrawerAddress: "",
//           },
//         });
//       } catch (error) {
//         console.error(error);
//         withdrawreservesErrors++;
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     withdrawreservesErrors++;
//   }
// };

// let withdrawsharesErrors = 0;
// const seedWithdrawShares = async () => {
//   try {
//     const withdrawShares = JSON.parse(
//       readFileSync("src/seed/json_exports/withdrawshares.json").toString()
//     );
//     for (const withdrawShare of withdrawShares) {
//       try {
//         await prisma.shareWithdrawal.create({
//           data: {
//             bondDid: withdrawShare.bond_did,
//             recipientDid: withdrawShare.recipient_did,
//             height: withdrawShare.height,
//             timestamp: withdrawShare.timestamp,
//             recipientAddress: "",
//           },
//         });
//       } catch (error) {
//         console.error(error);
//         withdrawsharesErrors++;
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     withdrawsharesErrors++;
//   }
// };

// const countRecords = async () => {
//   try {
//     const agents = await prisma.agent.count();
//     const alphas = await prisma.alpha.count();
//     const bonds = await prisma.bond.count();
//     const chains = await prisma.chain.count();
//     const claims = await prisma.claim.count();
//     const dids = await prisma.iID.count();
//     const events = await prisma.event.count();
//     const paymentoutcomes = await prisma.outcomePayment.count();
//     const projects = await prisma.project.count();
//     const stats = await prisma.stats.count();
//     const transactions = await prisma.bondBuy.count();
//     const withdrawreserves = await prisma.reserveWithdrawal.count();
//     const withdrawshares = await prisma.shareWithdrawal.count();

//     console.log({
//       Succeeded: {
//         agents,
//         alphas,
//         bonds,
//         chains,
//         claims,
//         dids,
//         events,
//         paymentoutcomes,
//         projects,
//         stats,
//         transactions,
//         withdrawreserves,
//         withdrawshares,
//       },
//       Failed: {
//         agents: agentsErrors,
//         alphas: alphaErrors,
//         bonds: bondsErrors,
//         chains: chainsErrors,
//         claims: claimsErrors,
//         dids: didsErrors,
//         events: eventsErrors,
//         paymentoutcomes: paymentoutcomesErrors,
//         projects: projectsErrors,
//         stats: statsErrors,
//         transactions: transactionsErrors,
//         withdrawreserves: withdrawreservesErrors,
//         withdrawshares: withdrawsharesErrors,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//   }
// };

// const seed = async () => {
//   // await seedAlphas();
//   // await seedBonds();
//   // await seedChains();
//   // await seedDids();
//   // await seedEvents();
//   // await seedPaymentOutcomes();
//   // await seedProjects();
//   // await seedAgents();
//   // await seedClaims();
//   // await seedStats();
//   // await seedTransactions();
//   // await seedWithdrawReserves();
//   // await seedWithdrawShares();
//   // await countRecords();
// };

// // seed();
