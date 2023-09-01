import { queryClient, registry } from "../sync/sync_chain";

export const getLatestBlock = async () => {
  try {
    const res =
      await queryClient.cosmos.base.tendermint.v1beta1.getLatestBlock();
    return res;
  } catch (error) {
    console.error("getLatestBlock: ", error.message);
    return;
  }
};

export const decodeMessage = (tx: any) => {
  try {
    return registry.decode(tx);
  } catch (error) {
    console.error(error.message);
    return;
  }
};

// export const getAccountBonds = async (address: string) => {
//   try {
//     const balances = await queryClient.cosmos.bank.v1beta1.allBalances({
//       address: address,
//     });
//     const denoms: string[] = [];
//     for (const balance of balances.balances) {
//       denoms.push(balance.denom);
//     }
//     const bonds = await queryClient.ixo.bonds.v1beta1.bondsDetailed();
//     const accountBonds = bonds.bondsDetailed.filter((bond) => {
//       const supplyDenom = bond.supply?.denom || "";
//       return denoms.includes(supplyDenom);
//     });
//     const res: any[] = [];
//     for (let index = 0; index < accountBonds.length; index++) {
//       const bond = (
//         await queryClient.ixo.bonds.v1beta1.bond({
//           bondDid: accountBonds[index].bondDid,
//         })
//       ).bond;
//       const amount = balances.balances[index].amount;
//       const denom = accountBonds[index].supply?.denom;
//       const price = accountBonds[index].spotPrice;
//       res.push({ bond, amount, denom, price });
//     }
//     return res;
//   } catch (error) {
//     console.error(error);
//     return;
//   }
// };
