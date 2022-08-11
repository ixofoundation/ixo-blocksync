-- CreateTable
CREATE TABLE "DID" (
    "did" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,

    CONSTRAINT "DID_pkey" PRIMARY KEY ("did")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "claimKyc" BOOLEAN NOT NULL,
    "issuer" TEXT NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bond" (
    "bondDid" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "creatorDid" TEXT NOT NULL,

    CONSTRAINT "Bond_pkey" PRIMARY KEY ("bondDid")
);

-- CreateTable
CREATE TABLE "PriceEntry" (
    "id" TEXT NOT NULL,
    "bondDid" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PriceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlphaChange" (
    "id" TEXT NOT NULL,
    "bondDid" TEXT NOT NULL,
    "rawValue" TEXT NOT NULL,
    "height" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,

    CONSTRAINT "AlphaChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutcomePayment" (
    "id" TEXT NOT NULL,
    "bondDid" TEXT NOT NULL,
    "rawValue" TEXT NOT NULL,
    "senderDid" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "height" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,

    CONSTRAINT "OutcomePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReserveWithdrawal" (
    "id" TEXT NOT NULL,
    "bondDid" TEXT NOT NULL,
    "rawValue" TEXT NOT NULL,
    "transaction" TEXT NOT NULL,
    "withdrawerDid" TEXT NOT NULL,
    "height" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,

    CONSTRAINT "ReserveWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareWithdrawal" (
    "id" TEXT NOT NULL,
    "bondDid" TEXT NOT NULL,
    "rawValue" TEXT NOT NULL,
    "transaction" TEXT NOT NULL,
    "recipientDid" TEXT NOT NULL,
    "height" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,

    CONSTRAINT "ShareWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "bondDid" TEXT NOT NULL,
    "buyerDid" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "maxPrices" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chain" (
    "chainId" TEXT NOT NULL,
    "blockHeight" BIGINT NOT NULL,

    CONSTRAINT "Chain_pkey" PRIMARY KEY ("chainId")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "attributes" JSONB[],
    "blockHeight" BIGINT NOT NULL,
    "eventSource" TEXT NOT NULL,
    "eventIndex" BIGINT[],
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stat" (
    "id" TEXT NOT NULL,
    "totalServiceProviders" INTEGER NOT NULL,
    "totalProjects" INTEGER NOT NULL,
    "totalEvaluationAgents" INTEGER NOT NULL,
    "totalInvestors" INTEGER NOT NULL,
    "totalClaims" INTEGER NOT NULL,
    "successfulClaims" INTEGER NOT NULL,
    "submittedClaims" INTEGER NOT NULL,
    "pendingClaims" INTEGER NOT NULL,
    "rejectedClaims" INTEGER NOT NULL,
    "claimLocations" TEXT[],

    CONSTRAINT "Stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "projectDid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT NOT NULL,
    "impactAction" TEXT NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "projectLocation" TEXT NOT NULL,
    "requiredClaims" TEXT NOT NULL,
    "sdgs" TEXT[],
    "templateSchema" TEXT NOT NULL,
    "templateForm" TEXT NOT NULL,
    "successfulClaims" INTEGER NOT NULL,
    "rejectedClaims" INTEGER NOT NULL,
    "evaluators" INTEGER NOT NULL,
    "evaluatorsPending" INTEGER NOT NULL,
    "serviceProviders" INTEGER NOT NULL,
    "serviceProvidersPending" INTEGER NOT NULL,
    "investors" INTEGER NOT NULL,
    "investorsPending" INTEGER NOT NULL,
    "ixoStaked" DECIMAL(65,30) NOT NULL,
    "ixoUsed" DECIMAL(65,30) NOT NULL,
    "serviceEndpoint" TEXT NOT NULL,
    "imageLink" TEXT NOT NULL,
    "founderName" TEXT NOT NULL,
    "founderEmail" TEXT NOT NULL,
    "founderCountry" TEXT NOT NULL,
    "founderDescription" TEXT NOT NULL,
    "founderWebsite" TEXT NOT NULL,
    "founderLogo" TEXT NOT NULL,
    "nodeDid" TEXT NOT NULL,
    "pubKey" TEXT NOT NULL,
    "senderDid" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("projectDid")
);

-- CreateTable
CREATE TABLE "Agent" (
    "agentDid" TEXT NOT NULL,
    "projectDid" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "kyc" BOOLEAN,
    "role" TEXT NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("agentDid")
);

-- CreateTable
CREATE TABLE "Claim" (
    "claimId" TEXT NOT NULL,
    "projectDid" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT[],
    "claimTemplateId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "saId" TEXT NOT NULL,
    "eaId" TEXT,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("claimId")
);

-- CreateIndex
CREATE INDEX "DID_did_idx" ON "DID"("did");

-- CreateIndex
CREATE INDEX "Chain_chainId_idx" ON "Chain"("chainId");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Project_projectDid_idx" ON "Project"("projectDid");

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_did_fkey" FOREIGN KEY ("did") REFERENCES "DID"("did") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceEntry" ADD CONSTRAINT "PriceEntry_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlphaChange" ADD CONSTRAINT "AlphaChange_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutcomePayment" ADD CONSTRAINT "OutcomePayment_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReserveWithdrawal" ADD CONSTRAINT "ReserveWithdrawal_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareWithdrawal" ADD CONSTRAINT "ShareWithdrawal_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_projectDid_fkey" FOREIGN KEY ("projectDid") REFERENCES "Project"("projectDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_projectDid_fkey" FOREIGN KEY ("projectDid") REFERENCES "Project"("projectDid") ON DELETE RESTRICT ON UPDATE CASCADE;
