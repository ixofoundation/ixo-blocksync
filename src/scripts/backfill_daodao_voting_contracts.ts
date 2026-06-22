/**
 * One-off backfill: link daodao voting modules to their member/staker contracts.
 *
 * Why this exists
 * ---------------
 * The daodao wasm-cutoff snapshot historically created `dao_voting_module` rows
 * WITHOUT `group_contract_address` (cw4) / `staking_contract` (cw20) — see
 * snapshotVotingModule. Members/stakers were still indexed (keyed by group/
 * staking contract), but with the link missing they're unreachable via the
 *   dao_core → dao_voting_module → group/staking contract → members
 * traversal that GraphQL consumers (e.g. the matrix rooms bot) rely on. Only
 * DAOs that existed AT the cutoff snapshot are affected; anything created after
 * it (via live events) already has the link.
 *
 * The snapshot is now fixed, so a FRESH reindex is correct. This script repairs
 * EXISTING DBs that already ran the old snapshot and are now past that height —
 * without a re-snapshot. It queries the chain once per orphaned module (the
 * pointer is immutable) and sets the link + refreshes the cached total_weight.
 *
 * Usage
 * -----
 *   npx ts-node src/scripts/backfill_daodao_voting_contracts.ts [--dry-run]
 *
 * Env: DATABASE_URL, IXO_ARCHIVE_NODE_REST_API, NETWORK (same as the indexer).
 *      BACKFILL_HEIGHT — override the archive query height (defaults to the
 *      stored snapshot height, else the network's daodao cutoff height).
 *
 * Idempotent: only touches rows still missing the link, so it's safe to re-run.
 */
import { NETWORK } from "../util/secrets";
import { DAODAO_CUTOFF_HEIGHTS } from "../constants/daodao_cutoff";
import { pool, dbQuery } from "../postgres/client";
import {
  daoVotingCw4GroupContractQuery,
  daoVotingCw20StakingContractQuery,
} from "../util/archive-queries";
import {
  getDaodaoSnapshotState,
  ensureDaoCw4GroupContract,
  ensureDaoCw20StakingContract,
  updateDaoVotingModuleGroupContractAddress,
  updateDaoVotingModuleTokenStakingContractAddress,
  getDaoCw4SumWeightForGroupContract,
  getDaoCw20StakersSumStakedForContract,
  updateDaoAllVotingModulesTotalWeightForGroupContract,
  updateDaoAllVotingModulesTotalWeightForCw20Contract,
} from "../postgres/dao";

const log = (...args: any[]) => console.log("[backfill-daodao]", ...args);

const resolveHeight = async (): Promise<number> => {
  const envH = Number(process.env.BACKFILL_HEIGHT);
  if (Number.isFinite(envH) && envH > 0) return envH;
  const snap = await getDaodaoSnapshotState();
  if (snap?.snapshot_height) return snap.snapshot_height;
  const cutoff = DAODAO_CUTOFF_HEIGHTS[NETWORK];
  if (cutoff) return cutoff;
  throw new Error(
    "Could not determine a query height — set BACKFILL_HEIGHT explicitly."
  );
};

const main = async () => {
  const dryRun = process.argv.includes("--dry-run");
  const height = await resolveHeight();
  log(`network=${NETWORK} height=${height} dryRun=${dryRun}`);

  const cw4Orphans = (
    await dbQuery(
      `SELECT address FROM dao_voting_module
        WHERE module_type = 'dao_voting_cw4' AND group_contract_address IS NULL
        ORDER BY address;`
    )
  ).rows.map((r: any) => r.address as string);
  const cw20Orphans = (
    await dbQuery(
      `SELECT address FROM dao_voting_module
        WHERE module_type = 'dao_voting_cw20_staked' AND staking_contract IS NULL
        ORDER BY address;`
    )
  ).rows.map((r: any) => r.address as string);
  log(`orphans: cw4=${cw4Orphans.length} cw20=${cw20Orphans.length}`);

  let cw4Linked = 0;
  let cw4NoContract = 0;
  let cw20Linked = 0;
  let cw20NoContract = 0;
  const errors: Array<{ address: string; error: string }> = [];

  for (let i = 0; i < cw4Orphans.length; i++) {
    const address = cw4Orphans[i];
    const tag = `[cw4 ${i + 1}/${cw4Orphans.length}] ${address}`;
    try {
      const groupContract = await daoVotingCw4GroupContractQuery(
        height,
        address
      );
      if (!groupContract) {
        cw4NoContract++;
        log(`${tag} → no group_contract returned, skipping`);
        continue;
      }
      if (dryRun) {
        log(`${tag} → would link group_contract=${groupContract}`);
        cw4Linked++;
        continue;
      }
      await ensureDaoCw4GroupContract(groupContract);
      await updateDaoVotingModuleGroupContractAddress({
        address,
        group_contract_address: groupContract,
      });
      const totalWeight = await getDaoCw4SumWeightForGroupContract(
        groupContract
      );
      await updateDaoAllVotingModulesTotalWeightForGroupContract(
        groupContract,
        totalWeight.toString()
      );
      cw4Linked++;
      log(`${tag} → linked group_contract=${groupContract} weight=${totalWeight}`);
    } catch (error: any) {
      const msg = error?.message ?? String(error);
      errors.push({ address, error: msg });
      log(`${tag} → ERROR ${msg}`);
    }
  }

  for (let i = 0; i < cw20Orphans.length; i++) {
    const address = cw20Orphans[i];
    const tag = `[cw20 ${i + 1}/${cw20Orphans.length}] ${address}`;
    try {
      const stakingContract = await daoVotingCw20StakingContractQuery(
        height,
        address
      );
      if (!stakingContract) {
        cw20NoContract++;
        log(`${tag} → no staking_contract returned, skipping`);
        continue;
      }
      if (dryRun) {
        log(`${tag} → would link staking_contract=${stakingContract}`);
        cw20Linked++;
        continue;
      }
      await ensureDaoCw20StakingContract(stakingContract);
      await updateDaoVotingModuleTokenStakingContractAddress({
        address,
        staking_contract: stakingContract,
      });
      const totalWeight = await getDaoCw20StakersSumStakedForContract(
        stakingContract
      );
      await updateDaoAllVotingModulesTotalWeightForCw20Contract(
        stakingContract,
        totalWeight.toString()
      );
      cw20Linked++;
      log(
        `${tag} → linked staking_contract=${stakingContract} weight=${totalWeight}`
      );
    } catch (error: any) {
      const msg = error?.message ?? String(error);
      errors.push({ address, error: msg });
      log(`${tag} → ERROR ${msg}`);
    }
  }

  log("==== summary ====");
  log(`cw4:  linked=${cw4Linked} noContract=${cw4NoContract} total=${cw4Orphans.length}`);
  log(`cw20: linked=${cw20Linked} noContract=${cw20NoContract} total=${cw20Orphans.length}`);
  log(`errors=${errors.length}`);
  for (const e of errors) log(`  ! ${e.address}: ${e.error}`);
  if (dryRun) log("DRY RUN — no rows were written.");
};

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("[backfill-daodao] FATAL", error);
    await pool.end();
    process.exit(1);
  });
