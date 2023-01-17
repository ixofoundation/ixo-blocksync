-- CreateTable
CREATE TABLE "IID" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "updated" TIMESTAMP(3) NOT NULL,
    "created" TIMESTAMP(3) NOT NULL,
    "deactivated" BOOLEAN,
    "entityType" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" INTEGER,
    "stage" TEXT,
    "relayerNode" TEXT,
    "verifiableCredential" TEXT,
    "credentials" TEXT[],
    "Controller" TEXT[],
    "Context" JSONB[],

    CONSTRAINT "IID_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationMethod" (
    "id" TEXT NOT NULL,
    "iid" TEXT NOT NULL,
    "relationships" TEXT[],
    "type" TEXT NOT NULL,
    "controller" TEXT NOT NULL,
    "verificationMaterial" TEXT NOT NULL,

    CONSTRAINT "VerificationMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "iid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "serviceEndpoint" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccordedRight" (
    "id" TEXT NOT NULL,
    "iid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mechanism" TEXT NOT NULL,
    "service" TEXT NOT NULL,

    CONSTRAINT "AccordedRight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedResource" (
    "id" TEXT NOT NULL,
    "iid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "serviceEndpoint" TEXT NOT NULL,
    "proof" TEXT NOT NULL,
    "encrypted" TEXT NOT NULL,
    "right" TEXT NOT NULL,

    CONSTRAINT "LinkedResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedEntity" (
    "id" TEXT NOT NULL,
    "iid" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,

    CONSTRAINT "LinkedEntity_pkey" PRIMARY KEY ("id")
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
    "allowSells" BOOLEAN NOT NULL,
    "allowReserveWithdrawals" BOOLEAN NOT NULL,
    "alphaBond" BOOLEAN NOT NULL,
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
    "attributes" JSONB[],
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
CREATE TABLE "Project" (
    "projectDid" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "senderDid" TEXT NOT NULL,
    "pubKey" TEXT NOT NULL,
    "data" JSONB,
    "projectAddress" TEXT NOT NULL,
    "status" TEXT,
    "entityType" TEXT,
    "createdOn" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
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
    "id" SERIAL NOT NULL,
    "agentDid" TEXT NOT NULL,
    "projectDid" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "claimId" TEXT NOT NULL,
    "projectDid" TEXT NOT NULL,
    "claimTemplateId" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("claimId")
);

-- CreateTable
CREATE TABLE "PaymentTemplate" (
    "id" TEXT NOT NULL,
    "paymentAmount" JSONB,
    "paymentMinimum" JSONB,
    "paymentMaximum" JSONB,
    "discounts" JSONB,
    "creatorDid" TEXT NOT NULL,
    "creatorAddress" TEXT NOT NULL,

    CONSTRAINT "PaymentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentContract" (
    "id" TEXT NOT NULL,
    "paymentTemplateId" TEXT NOT NULL,
    "payer" TEXT NOT NULL,
    "recipients" JSONB,
    "canDeauthorise" BOOLEAN NOT NULL,
    "authorised" BOOLEAN,
    "payerDid" TEXT,
    "effected" BOOLEAN,
    "senderDid" TEXT,
    "creatorDid" TEXT NOT NULL,
    "creatorAddress" TEXT NOT NULL,

    CONSTRAINT "PaymentContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "paymentContractId" TEXT NOT NULL,
    "maxPeriods" TEXT NOT NULL,
    "period" JSONB,
    "creatorDid" TEXT NOT NULL,
    "creatorAddress" TEXT NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "paymentContractId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "granter" TEXT NOT NULL,
    "revoked" BOOLEAN,
    "revoker" TEXT,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "blockHeight" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "from" TEXT,
    "value" JSONB,
    "fee" JSONB,
    "signatures" JSONB,
    "memo" TEXT NOT NULL,
    "timeoutHeight" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "WasmCode" (
    "code_id" INTEGER NOT NULL,
    "creator" TEXT NOT NULL DEFAULT '',
    "creation_time" TEXT NOT NULL DEFAULT '',
    "height" INTEGER NOT NULL,

    CONSTRAINT "WasmCode_pkey" PRIMARY KEY ("code_id")
);

-- CreateTable
CREATE TABLE "WasmContract" (
    "address" TEXT NOT NULL,
    "code_id" INTEGER NOT NULL,
    "creator" TEXT NOT NULL DEFAULT '',
    "admin" TEXT NOT NULL DEFAULT '',
    "label" TEXT NOT NULL DEFAULT '',
    "creation_time" TEXT NOT NULL DEFAULT '',
    "height" INTEGER NOT NULL,
    "json" JSONB DEFAULT '{}',

    CONSTRAINT "WasmContract_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "ExecMsg" (
    "id" SERIAL NOT NULL,
    "sender" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "funds" JSONB,
    "json" JSONB,

    CONSTRAINT "ExecMsg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chain_chainId_idx" ON "Chain"("chainId");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Project_projectDid_idx" ON "Project"("projectDid");

-- CreateIndex
CREATE INDEX "Block_hash_idx" ON "Block"("hash");

-- CreateIndex
CREATE INDEX "Block_proposer_address_idx" ON "Block"("proposer_address");

-- CreateIndex
CREATE INDEX "WasmCode_creator_idx" ON "WasmCode"("creator");

-- CreateIndex
CREATE INDEX "WasmContract_code_id_idx" ON "WasmContract"("code_id");

-- CreateIndex
CREATE INDEX "WasmContract_creator_idx" ON "WasmContract"("creator");

-- AddForeignKey
ALTER TABLE "VerificationMethod" ADD CONSTRAINT "VerificationMethod_iid_fkey" FOREIGN KEY ("iid") REFERENCES "IID"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_iid_fkey" FOREIGN KEY ("iid") REFERENCES "IID"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccordedRight" ADD CONSTRAINT "AccordedRight_iid_fkey" FOREIGN KEY ("iid") REFERENCES "IID"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedResource" ADD CONSTRAINT "LinkedResource_iid_fkey" FOREIGN KEY ("iid") REFERENCES "IID"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedEntity" ADD CONSTRAINT "LinkedEntity_iid_fkey" FOREIGN KEY ("iid") REFERENCES "IID"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_projectDid_fkey" FOREIGN KEY ("projectDid") REFERENCES "Project"("projectDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_projectDid_fkey" FOREIGN KEY ("projectDid") REFERENCES "Project"("projectDid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_paymentContractId_fkey" FOREIGN KEY ("paymentContractId") REFERENCES "PaymentContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_paymentContractId_fkey" FOREIGN KEY ("paymentContractId") REFERENCES "PaymentContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
