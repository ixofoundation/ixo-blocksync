import Long from "long";
import { prisma } from "../prisma/prisma_client";
import { queryClient, registry } from "../sync/sync_chain";
import { Uint8ArrayToJS } from "../util/conversions";
import { sleep } from "../util/sleep";

export const supplyTotal = async () => {
  let supply: any[] = [];
  let key: Uint8Array | undefined;
  const query = async (key?: Uint8Array) =>
    await queryClient.cosmos.bank.v1beta1.totalSupply({
      pagination: {
        // @ts-ignore
        key: key || [],
        limit: Long.fromNumber(1000),
        offset: Long.fromNumber(0),
      },
    });

  while (true) {
    const res = await query(key);
    supply = [...supply, ...res.supply];
    key = res.pagination?.nextKey || undefined;
    if (!key?.length) break;
  }

  // convert all ibc denoms to traces to see the original denom
  for (const sup of supply) {
    if (sup.denom.includes("ibc/")) {
      const trace = await queryClient.ibc.applications.transfer.v1.denomTrace({
        hash: sup.denom.split("/")[1],
      });
      sup.trace = trace.denomTrace;
    }
  }

  return supply;
};

export const supplyStaked = async () => {
  const res = await queryClient.cosmos.staking.v1beta1.pool({});
  return res.pool;
};

export const supplyCommunityPool = async () => {
  const res = await queryClient.cosmos.distribution.v1beta1.communityPool();
  return res.pool;
};

export const inflation = async () => {
  const res = await queryClient.cosmos.mint.v1beta1.inflation();
  const inflation = Number(Uint8ArrayToJS(res.inflation));

  // Cosmos DEC is 18 decimals, so devide by 10^16 to get the correct percentage value
  return inflation / Math.pow(10, 16);
};

export const getAccountsAndBalances = async () => {
  try {
    let accounts: any[] = [];
    let key: Uint8Array | undefined;
    const query = async (key?: Uint8Array) =>
      await queryClient.cosmos.auth.v1beta1.accounts({
        pagination: {
          // @ts-ignore
          key: key || [],
          limit: Long.fromNumber(1000),
          offset: Long.fromNumber(0),
        },
      });

    while (true) {
      const res = await query(key);
      accounts = [
        ...accounts,
        ...res.accounts.map((acc) => {
          const parsedAccount = registry.decode(acc);
          return parsedAccount.baseAccount ?? parsedAccount;
        }),
      ];
      key = res.pagination?.nextKey || undefined;
      if (!key?.length) break;
    }

    let i = 0;
    // get balances for each account
    for (const acc of accounts) {
      console.log(i++);
      console.log(acc);
      await sleep(50);
      const [availBalance, delegationsBalance, rewardsBalance] =
        await Promise.all([
          (async () => {
            // avail balance
            const availBalance = await queryClient.cosmos.bank.v1beta1.balance({
              denom: "uixo",
              address: acc.address,
            });
            return Number(availBalance?.balance?.amount || 0);
          })(),
          (async () => {
            // delegations balance
            const delegations =
              await queryClient.cosmos.staking.v1beta1.delegatorDelegations({
                delegatorAddr: acc.address,
              });
            let delegationsBalance = 0;
            delegations.delegationResponses.map((d) => {
              const amount = Number(d.balance?.amount ?? "0");
              delegationsBalance += amount;
            });
            return delegationsBalance;
          })(),
          (async () => {
            // rewards balance
            const rewardsBalance =
              await queryClient.cosmos.distribution.v1beta1.delegationTotalRewards(
                {
                  delegatorAddress: acc.address,
                }
              );
            const rewardsBalanceAmount = rewardsBalance?.total?.[0]?.amount;
            return Number(
              rewardsBalanceAmount ? rewardsBalanceAmount.slice(0, -18) : 0
            );
          })(),
        ]);

      await prisma.tokenomicsAccount.upsert({
        where: { address: acc.address },
        update: {
          availBalance,
          delegationsBalance,
          rewardsBalance,
          totalBalance: availBalance + delegationsBalance + rewardsBalance,
        },
        create: {
          address: acc.address,
          accountNumber: acc.accountNumber.low,
          availBalance,
          delegationsBalance,
          rewardsBalance,
          totalBalance: availBalance + delegationsBalance + rewardsBalance,
        },
      });
    }
    console.log("doner!!!");
    return { success: true };
  } catch (error) {
    console.log("ERROR::tokenomics::getAccountsAndBalances ", error);
    return { success: false, error };
  }
};
