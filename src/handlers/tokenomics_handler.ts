import Long from "long";
import { queryClient, registry } from "../sync/sync_chain";
import { sleep } from "../util/sleep";
import { upsertTokenomicsAccount } from "../postgres/tokenomics_account";

// IBC escrow accounts get tagged with type "ibc_escrow" in the accounts table
const getIBCEscrows = async () => {
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
      return escrowAcc.escrowAddress;
    })
  );
  return escrows;
};

// Get all accounts and balances for tokenomics
export const getAccountsAndBalances = async () => {
  const start = Date.now();
  let skippedSomeUpload = false;
  try {
    let ibcEscrows = await getIBCEscrows();

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

    console.log(
      "Fetching accounts and balances started for ",
      accounts.length,
      " accounts"
    );

    // get balances for each account
    for (const acc of accounts) {
      await sleep(70);
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
  } finally {
    const end = Date.now();
    console.log(
      `Fetching accounts and balances took: ${
        end - start
      }ms, skippedSomeUpload: ${skippedSomeUpload}`
    );
  }
};
