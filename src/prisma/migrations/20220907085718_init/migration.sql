-- CreateTable
CREATE TABLE "DID" (
    "did" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,

    CONSTRAINT "DID_pkey" PRIMARY KEY ("did")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" SERIAL NOT NULL,
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
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "denom" TEXT,
    "price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PriceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlphaChange" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "rawValue" TEXT NOT NULL,
    "height" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,

    CONSTRAINT "AlphaChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutcomePayment" (
    "id" SERIAL NOT NULL,
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
    "id" SERIAL NOT NULL,
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
    "id" SERIAL NOT NULL,
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
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "buyerDid" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "maxPrices" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chain" (
    "chainId" TEXT NOT NULL,
    "blockHeight" INTEGER NOT NULL,

    CONSTRAINT "Chain_pkey" PRIMARY KEY ("chainId")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "attributes" JSONB[],
    "blockHeight" INTEGER NOT NULL,
    "eventSource" TEXT NOT NULL,
    "eventIndex" INTEGER[],
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stat" (
    "id" SERIAL NOT NULL,
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
    "data" JSONB,
    "txHash" TEXT NOT NULL,
    "senderDid" TEXT NOT NULL,
    "pubKey" TEXT NOT NULL,
    "status" TEXT,
    "entityType" TEXT,
    "ixoStaked" DECIMAL(65,30) NOT NULL,
    "ixoUsed" DECIMAL(65,30) NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "nodeDid" TEXT NOT NULL,
    "successfulClaims" INTEGER NOT NULL,
    "rejectedClaims" INTEGER NOT NULL,
    "evaluators" INTEGER NOT NULL,
    "evaluatorsPending" INTEGER NOT NULL,
    "serviceProviders" INTEGER NOT NULL,
    "serviceProvidersPending" INTEGER NOT NULL,
    "investors" INTEGER NOT NULL,
    "investorsPending" INTEGER NOT NULL,

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
    "status" TEXT NOT NULL,
    "saId" TEXT NOT NULL,
    "eaId" TEXT,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("claimId")
);

-- CreateTable
CREATE TABLE "BlockTransaction" (
    "id" SERIAL NOT NULL,
    "blockHeight" INTEGER NOT NULL,
    "msg" JSONB,
    "fee" JSONB,
    "signatures" JSONB,
    "memo" TEXT NOT NULL,
    "timeoutHeight" TEXT NOT NULL,

    CONSTRAINT "BlockTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockTransactionHeight" (
    "id" SERIAL NOT NULL,
    "blockHeight" INTEGER NOT NULL,

    CONSTRAINT "BlockTransactionHeight_pkey" PRIMARY KEY ("id")
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