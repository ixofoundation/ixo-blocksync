-- CreateTable
CREATE TABLE "TokenomicsAccount" (
    "address" TEXT NOT NULL,
    "accountNumber" INTEGER NOT NULL,
    "availBalance" BIGINT NOT NULL,
    "delegationsBalance" BIGINT NOT NULL,
    "rewardsBalance" BIGINT NOT NULL,
    "totalBalance" BIGINT NOT NULL,

    CONSTRAINT "TokenomicsAccount_pkey" PRIMARY KEY ("address")
);
