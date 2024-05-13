import Long from "long";
import { queryClient, registry } from "../sync/sync_chain";
import { Uint8ArrayToJS } from "../util/conversions";
import { sleep } from "../util/sleep";
import { upsertTokenomicsAccount } from "../postgres/tokenomics_account";

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

export const supplyIBC = async () => {
  const escrows = await getIBCEscrows(true);

  let total = 0;
  escrows.forEach((e) => {
    total += Number(e.balance);
  });

  return total;
};

const getIBCEscrows = async (includeBalance = false) => {
  // get all ibc channels
  const channels = await queryClient.ibc.core.channel.v1.channels({
    pagination: {
      // @ts-ignore
      key: [],
      limit: Long.fromNumber(1000),
      offset: Long.fromNumber(0),
    },
  });

  const escrows = await Promise.all(
    channels.channels.map(async (c) => {
      // get ibc channel escrow account
      const escrowAcc =
        await queryClient.ibc.applications.transfer.v1.escrowAddress({
          portId: c.portId,
          channelId: c.channelId,
        });
      // get balance for the escrow account
      const escrowBalance = includeBalance
        ? await queryClient.cosmos.bank.v1beta1.balance({
            address: escrowAcc.escrowAddress,
            denom: "uixo",
          })
        : undefined;
      return {
        account: escrowAcc.escrowAddress,
        balance: escrowBalance?.balance?.amount ?? "0",
      };
    })
  );
  return escrows;
};

export const supplyStaked = async () => {
  const res = await queryClient.cosmos.staking.v1beta1.pool({});
  return res.pool;
};

export const supplyCommunityPool = async () => {
  const res = await queryClient.cosmos.distribution.v1beta1.communityPool();
  return res.pool.map((c) => ({ ...c, amount: c.amount.slice(0, -18) }));
};

export const inflation = async () => {
  const res = await queryClient.cosmos.mint.v1beta1.inflation();
  const inflation = Number(Uint8ArrayToJS(res.inflation));

  // Cosmos DEC is 18 decimals, so devide by 10^16 to get the correct percentage value
  return inflation / Math.pow(10, 16);
};

export const getAccountsAndBalances = async () => {
  let skippedSomeUpload = false;
  try {
    let ibcEscrows = (await getIBCEscrows()).map((e) => e.account);

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
          const baseAccount =
            parsedAccount.baseVestingAccount?.baseAccount ??
            parsedAccount.baseAccount ??
            parsedAccount;

          let type = parsedAccount.baseVestingAccount?.baseAccount
            ? "vesting"
            : parsedAccount.baseAccount
            ? parsedAccount.name ?? null
            : null;
          if (ibcEscrows.includes(parsedAccount.address)) type = "ibc_escrow";
          baseAccount.type = type;

          return baseAccount;
        }),
      ];
      key = res.pagination?.nextKey || undefined;
      if (!key?.length) break;
    }

    let i = 0;
    // get balances for each account
    for (const acc of accounts) {
      // console.log("fetch acc balance", i++, acc.address);
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

      try {
        await upsertTokenomicsAccount({
          address: acc.address,
          accountNumber: acc.accountNumber.low,
          availBalance: BigInt(availBalance),
          delegationsBalance: BigInt(delegationsBalance),
          rewardsBalance: BigInt(rewardsBalance),
          totalBalance: BigInt(
            availBalance + delegationsBalance + rewardsBalance
          ),
          type: acc.type,
        });
      } catch (error) {
        skippedSomeUpload = true;
        console.error(
          "ERROR::tokenomics::getAccountsAndBalances::upsertTokenomicsAccount ",
          error
        );
      }
    }
    return { success: true, skippedSomeUpload };
  } catch (error) {
    console.log("ERROR::tokenomics::getAccountsAndBalances ", error);
    return { success: false, error: String(error), skippedSomeUpload };
  }
};
