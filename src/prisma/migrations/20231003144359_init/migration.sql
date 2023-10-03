-- CreateTable
CREATE TABLE "IID" (
    "id" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "controller" TEXT[],
    "verificationMethod" JSONB NOT NULL,
    "service" JSONB NOT NULL,
    "authentication" TEXT[],
    "assertionMethod" TEXT[],
    "keyAgreement" TEXT[],
    "capabilityInvocation" TEXT[],
    "capabilityDelegation" TEXT[],
    "linkedResource" JSONB NOT NULL,
    "linkedClaim" JSONB NOT NULL,
    "accordedRight" JSONB NOT NULL,
    "linkedEntity" JSONB NOT NULL,
    "alsoKnownAs" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "IID_pkey" PRIMARY KEY ("id")
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
    "metadata" JSONB NOT NULL,
    "accounts" JSONB NOT NULL,
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
    "payments" JSONB NOT NULL,

    CONSTRAINT "ClaimCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "claimId" TEXT NOT NULL,
    "agentDid" TEXT NOT NULL,
    "agentAddress" TEXT NOT NULL,
    "submissionDate" TIMESTAMP(3) NOT NULL,
    "paymentsStatus" JSONB NOT NULL,
    "schemaType" TEXT,
    "collectionId" TEXT NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("claimId")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "collectionId" TEXT NOT NULL,
    "oracle" TEXT NOT NULL,
    "agentDid" TEXT NOT NULL,
    "agentAddress" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "reason" INTEGER NOT NULL,
    "verificationProof" TEXT,
    "amount" JSONB NOT NULL,
    "evaluationDate" TIMESTAMP(3) NOT NULL,
    "claimId" TEXT NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("claimId")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "proof" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

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
    "amount" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TokenRetired_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "TokenCancelled" (
    "aid" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TokenCancelled_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "TokenTransaction" (
    "aid" SERIAL NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,

    CONSTRAINT "TokenTransaction_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "Bond" (
    "bondDid" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "functionType" TEXT NOT NULL,
    "functionParameters" JSONB NOT NULL,
    "creatorDid" TEXT NOT NULL,
    "controllerDid" TEXT NOT NULL,
    "reserveTokens" TEXT[],
    "txFeePercentage" TEXT NOT NULL,
    "exitFeePercentage" TEXT NOT NULL,
    "feeAddress" TEXT NOT NULL,
    "reserveWithdrawalAddress" TEXT NOT NULL,
    "maxSupply" JSONB,
    "orderQuantityLimits" JSONB NOT NULL,
    "sanityRate" TEXT NOT NULL,
    "sanityMarginPercentage" TEXT NOT NULL,
    "currentSupply" JSONB,
    "currentReserve" JSONB NOT NULL,
    "availableReserve" JSONB NOT NULL,
    "currentOutcomePaymentReserve" JSONB NOT NULL,
    "allowSells" BOOLEAN NOT NULL,
    "allowReserveWithdrawals" BOOLEAN NOT NULL,
    "alphaBond" BOOLEAN NOT NULL,
    "batchBlocks" TEXT NOT NULL,
    "outcomePayment" TEXT NOT NULL,
    "oracleDid" TEXT NOT NULL,

    CONSTRAINT "Bond_pkey" PRIMARY KEY ("bondDid")
);

-- CreateTable
CREATE TABLE "BondBuy" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "accountDid" TEXT NOT NULL,
    "amount" JSONB NOT NULL,
    "maxPrices" JSONB NOT NULL,
    "height" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BondBuy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BondSell" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "accountDid" TEXT NOT NULL,
    "amount" JSONB NOT NULL,
    "height" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BondSell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BondSwap" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "accountDid" TEXT NOT NULL,
    "amount" JSONB NOT NULL,
    "toToken" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BondSwap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReserveWithdrawal" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "withdrawerDid" TEXT NOT NULL,
    "withdrawerAddress" TEXT NOT NULL,
    "amount" JSONB NOT NULL,
    "reserveWithdrawalAddress" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReserveWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareWithdrawal" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "recipientDid" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "amount" JSONB NOT NULL,
    "height" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutcomePayment" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "senderDid" TEXT NOT NULL,
    "senderAddress" TEXT NOT NULL,
    "amount" JSONB NOT NULL,
    "height" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutcomePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BondAlpha" (
    "id" SERIAL NOT NULL,
    "bondDid" TEXT NOT NULL,
    "alpha" TEXT NOT NULL,
    "oracleDid" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BondAlpha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chain" (
    "chainId" TEXT NOT NULL,
    "blockHeight" INTEGER NOT NULL,

    CONSTRAINT "Chain_pkey" PRIMARY KEY ("chainId")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "hash" TEXT NOT NULL,
    "height" INTEGER NOT NULL,
    "code" INTEGER NOT NULL,
    "fee" JSONB NOT NULL,
    "gasUsed" TEXT NOT NULL,
    "gasWanted" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "typeUrl" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "from" TEXT,
    "to" TEXT,
    "denoms" TEXT[],
    "tokenNames" TEXT[],
    "transactionHash" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ipfs" (
    "cid" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" TEXT NOT NULL,

    CONSTRAINT "Ipfs_pkey" PRIMARY KEY ("cid")
);

-- CreateIndex
CREATE INDEX "Entity_owner_type_idx" ON "Entity"("owner", "type");

-- CreateIndex
CREATE INDEX "Claim_collectionId_idx" ON "Claim"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenClass_name_key" ON "TokenClass"("name");

-- CreateIndex
CREATE INDEX "Token_name_idx" ON "Token"("name");

-- CreateIndex
CREATE INDEX "TokenData_tokenId_idx" ON "TokenData"("tokenId");

-- CreateIndex
CREATE INDEX "TokenRetired_name_owner_idx" ON "TokenRetired"("name", "owner");

-- CreateIndex
CREATE INDEX "TokenCancelled_name_idx" ON "TokenCancelled"("name");

-- CreateIndex
CREATE INDEX "TokenTransaction_from_to_idx" ON "TokenTransaction"("from", "to");

-- CreateIndex
CREATE INDEX "Transaction_height_idx" ON "Transaction"("height");

-- CreateIndex
CREATE INDEX "Message_transactionHash_from_to_idx" ON "Message"("transactionHash", "from", "to");

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_id_fkey" FOREIGN KEY ("id") REFERENCES "IID"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ClaimCollection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("claimId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenClass" ADD CONSTRAINT "TokenClass_class_fkey" FOREIGN KEY ("class") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_collection_fkey" FOREIGN KEY ("collection") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "BondBuy" ADD CONSTRAINT "BondBuy_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BondSell" ADD CONSTRAINT "BondSell_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BondSwap" ADD CONSTRAINT "BondSwap_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReserveWithdrawal" ADD CONSTRAINT "ReserveWithdrawal_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareWithdrawal" ADD CONSTRAINT "ShareWithdrawal_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutcomePayment" ADD CONSTRAINT "OutcomePayment_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BondAlpha" ADD CONSTRAINT "BondAlpha_bondDid_fkey" FOREIGN KEY ("bondDid") REFERENCES "Bond"("bondDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_transactionHash_fkey" FOREIGN KEY ("transactionHash") REFERENCES "Transaction"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
