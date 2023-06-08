-- CreateTable
CREATE TABLE "IID" (
    "id" TEXT NOT NULL,
    "controller" TEXT[],
    "verificationMethod" JSONB,
    "authentication" TEXT[],
    "assertionMethod" TEXT[],
    "keyAgreement" TEXT[],
    "capabilityInvocation" TEXT[],
    "capabilityDelegation" TEXT[],
    "alsoKnownAs" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "IID_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Context" (
    "aid" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "val" TEXT NOT NULL,
    "iid" TEXT NOT NULL,

    CONSTRAINT "Context_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "Service" (
    "aid" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "serviceEndpoint" TEXT NOT NULL,
    "iid" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "LinkedResource" (
    "aid" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "serviceEndpoint" TEXT NOT NULL,
    "proof" TEXT NOT NULL,
    "encrypted" TEXT NOT NULL,
    "right" TEXT NOT NULL,
    "iid" TEXT NOT NULL,

    CONSTRAINT "LinkedResource_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "LinkedClaim" (
    "aid" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceEndpoint" TEXT NOT NULL,
    "proof" TEXT NOT NULL,
    "encrypted" TEXT NOT NULL,
    "right" TEXT NOT NULL,
    "iid" TEXT NOT NULL,

    CONSTRAINT "LinkedClaim_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "AccordedRight" (
    "aid" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "mechanism" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "iid" TEXT NOT NULL,

    CONSTRAINT "AccordedRight_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "LinkedEntity" (
    "aid" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "iid" TEXT NOT NULL,

    CONSTRAINT "LinkedEntity_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" INTEGER NOT NULL,
    "relayerNode" TEXT NOT NULL,
    "credentials" TEXT[],
    "entityVerified" BOOLEAN NOT NULL,
    "metadata" JSONB,
    "accounts" JSONB,
    "externalId" TEXT,
    "owner" TEXT,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimCollection" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "admin" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "quota" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,
    "evaluated" INTEGER NOT NULL,
    "approved" INTEGER NOT NULL,
    "rejected" INTEGER NOT NULL,
    "disputed" INTEGER NOT NULL,
    "state" INTEGER NOT NULL,
    "payments" JSONB,

    CONSTRAINT "ClaimCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "claimId" TEXT NOT NULL,
    "agentDid" TEXT NOT NULL,
    "agentAddress" TEXT NOT NULL,
    "submissionDate" TIMESTAMP(3),
    "paymentsStatus" JSONB,
    "collectionId" TEXT NOT NULL,
    "schemaType" TEXT,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("claimId")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "aid" SERIAL NOT NULL,
    "collectionId" TEXT NOT NULL,
    "oracle" TEXT NOT NULL,
    "agentDid" TEXT NOT NULL,
    "agentAddress" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "reason" INTEGER NOT NULL,
    "verificationProof" TEXT,
    "amount" JSONB NOT NULL,
    "evaluationDate" TIMESTAMP(3),
    "claimId" TEXT NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "proof" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "data" JSONB,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("proof")
);

-- CreateTable
CREATE TABLE "TokenClass" (
    "contractAddress" TEXT NOT NULL,
    "minter" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cap" TEXT NOT NULL,
    "supply" TEXT NOT NULL,
    "paused" BOOLEAN NOT NULL,
    "stopped" BOOLEAN NOT NULL,

    CONSTRAINT "TokenClass_pkey" PRIMARY KEY ("contractAddress")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "collection" TEXT NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenData" (
    "aid" SERIAL NOT NULL,
    "uri" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL,
    "proof" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,

    CONSTRAINT "TokenData_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "TokenRetired" (
    "aid" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "amount" JSONB NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TokenRetired_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "TokenCancelled" (
    "aid" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" JSONB NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TokenCancelled_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "TokenTransaction" (
    "id" SERIAL NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,

    CONSTRAINT "TokenTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bond" (
    "bondDid" TEXT NOT NULL,
    "status" TEXT,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "functionType" TEXT NOT NULL,
    "functionParamaters" JSONB,
    "creatorDid" TEXT NOT NULL,
    "controllerDid" TEXT NOT NULL,
    "reserveTokens" TEXT[],
    "txFeePercentage" TEXT NOT NULL,
    "exitFeePercentage" TEXT NOT NULL,
    "feeAddress" TEXT NOT NULL,
    "reserveWithdrawalAddress" TEXT NOT NULL,
    "maxSupply" JSONB,
    "orderQuantityLimits" JSONB,
    "sanityRate" TEXT NOT NULL,
    "sanityMarginPercentage" TEXT NOT NULL,
    "allowSells" BOOLEAN,
    "allowReserveWithdrawals" BOOLEAN,
    "alphaBond" BOOLEAN,
    "batchBlocks" TEXT NOT NULL,
    "creatorAddress" TEXT NOT NULL,
    "editorDid" TEXT,
    "editorAddress" TEXT,

    CONSTRAINT "Bond_pkey" PRIMARY KEY ("bondDid")
);

-- CreateTable
CREATE TABLE "PriceEntry" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "denom" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PriceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BondBuy" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "buyerDid" TEXT NOT NULL,
    "buyerAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "maxPrices" JSONB,

    CONSTRAINT "BondBuy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BondSell" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "sellerDid" TEXT NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,

    CONSTRAINT "BondSell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BondSwap" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "swapperDid" TEXT NOT NULL,
    "swapperAddress" TEXT NOT NULL,
    "from" JSONB,
    "toToken" TEXT NOT NULL,

    CONSTRAINT "BondSwap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alpha" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "alpha" TEXT NOT NULL,
    "delta" TEXT NOT NULL,
    "oracleDid" TEXT NOT NULL,
    "oracleAddress" TEXT NOT NULL,
    "height" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,

    CONSTRAINT "Alpha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutcomePayment" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "senderDid" TEXT NOT NULL,
    "senderAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "height" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,

    CONSTRAINT "OutcomePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReserveWithdrawal" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "withdrawerDid" TEXT NOT NULL,
    "withdrawerAddress" TEXT NOT NULL,
    "amount" JSONB,
    "height" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,

    CONSTRAINT "ReserveWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareWithdrawal" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "recipientDid" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "height" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,

    CONSTRAINT "ShareWithdrawal_pkey" PRIMARY KEY ("id")
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
    "attributes" JSONB,
    "blockHeight" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stats" (
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

    CONSTRAINT "Stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "hash" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "code" INTEGER NOT NULL,
    "fee" JSONB,
    "gasUsed" TEXT NOT NULL,
    "gasWanted" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "typeUrl" TEXT NOT NULL,
    "value" JSONB,
    "from" TEXT,
    "to" TEXT,
    "denoms" TEXT[],
    "tokenNames" TEXT[],

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "height" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "num_txs" INTEGER NOT NULL DEFAULT 0,
    "total_gas" INTEGER NOT NULL DEFAULT 0,
    "proposer_address" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("height")
);

-- CreateTable
CREATE TABLE "Ipfs" (
    "cid" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" TEXT NOT NULL,

    CONSTRAINT "Ipfs_pkey" PRIMARY KEY ("cid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_claimId_key" ON "Evaluation"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenClass_name_key" ON "TokenClass"("name");

-- AddForeignKey
ALTER TABLE "Context" ADD CONSTRAINT "Context_iid_fkey" FOREIGN KEY ("iid") REFERENCES "IID"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_iid_fkey" FOREIGN KEY ("iid") REFERENCES "IID"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedResource" ADD CONSTRAINT "LinkedResource_iid_fkey" FOREIGN KEY ("iid") REFERENCES "IID"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedClaim" ADD CONSTRAINT "LinkedClaim_iid_fkey" FOREIGN KEY ("iid") REFERENCES "IID"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccordedRight" ADD CONSTRAINT "AccordedRight_iid_fkey" FOREIGN KEY ("iid") REFERENCES "IID"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedEntity" ADD CONSTRAINT "LinkedEntity_iid_fkey" FOREIGN KEY ("iid") REFERENCES "IID"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_id_fkey" FOREIGN KEY ("id") REFERENCES "IID"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ClaimCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("claimId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_name_fkey" FOREIGN KEY ("name") REFERENCES "TokenClass"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenData" ADD CONSTRAINT "TokenData_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenRetired" ADD CONSTRAINT "TokenRetired_name_fkey" FOREIGN KEY ("name") REFERENCES "TokenClass"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenCancelled" ADD CONSTRAINT "TokenCancelled_name_fkey" FOREIGN KEY ("name") REFERENCES "TokenClass"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenTransaction" ADD CONSTRAINT "TokenTransaction_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceEntry" ADD CONSTRAINT "PriceEntry_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BondBuy" ADD CONSTRAINT "BondBuy_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BondSell" ADD CONSTRAINT "BondSell_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BondSwap" ADD CONSTRAINT "BondSwap_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alpha" ADD CONSTRAINT "Alpha_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutcomePayment" ADD CONSTRAINT "OutcomePayment_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReserveWithdrawal" ADD CONSTRAINT "ReserveWithdrawal_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareWithdrawal" ADD CONSTRAINT "ShareWithdrawal_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES "Transaction"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
