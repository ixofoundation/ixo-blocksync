import { dbQuery } from "./client";

// =============================================
// V7 snapshot state — single-row table (see
// migrations/20260527000000000_v7_snapshot_state.sql).
// =============================================

export type V7SnapshotState = {
  network: string;
  upgrade_height: number;
  snapshot_height: number;
  started_at: Date;
  completed_at: Date | null;
};

export const getV7SnapshotState = async (): Promise<V7SnapshotState | null> => {
  const r = await dbQuery(
    `SELECT network, upgrade_height, snapshot_height, started_at, completed_at
       FROM v7_snapshot_state WHERE id = 1;`
  );
  return (r.rows[0] as any) ?? null;
};

export const startV7Snapshot = async (data: {
  network: string;
  upgrade_height: number;
  snapshot_height: number;
}): Promise<void> => {
  await dbQuery(
    `INSERT INTO v7_snapshot_state
       (id, network, upgrade_height, snapshot_height, started_at)
     VALUES (1, $1, $2, $3, NOW())
     ON CONFLICT (id) DO UPDATE SET
       network = EXCLUDED.network,
       upgrade_height = EXCLUDED.upgrade_height,
       snapshot_height = EXCLUDED.snapshot_height,
       started_at = NOW(),
       completed_at = NULL;`,
    [data.network, data.upgrade_height, data.snapshot_height]
  );
};

export const finishV7Snapshot = async (counts: {
  pools_count: number;
  module_params_written: boolean;
  legacy_ls_tx_relinked: number;
  legacy_disputes_dismissed: number;
  collections_refreshed: number;
}): Promise<void> => {
  await dbQuery(
    `UPDATE v7_snapshot_state SET
       completed_at = NOW(),
       pools_count = $1,
       module_params_written = $2,
       legacy_ls_tx_relinked = $3,
       legacy_disputes_dismissed = $4,
       collections_refreshed = $5
     WHERE id = 1;`,
    [
      counts.pools_count,
      counts.module_params_written,
      counts.legacy_ls_tx_relinked,
      counts.legacy_disputes_dismissed,
      counts.collections_refreshed,
    ]
  );
};
