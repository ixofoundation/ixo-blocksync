export enum EventTypes {
  // iid
  createIid = "ixo.iid.v1beta1.IidDocumentCreatedEvent",
  updateIid = "ixo.iid.v1beta1.IidDocumentUpdatedEvent",
  // entity
  createEntity = "ixo.entity.v1beta1.EntityCreatedEvent",
  updateEntity = "ixo.entity.v1beta1.EntityUpdatedEvent",
  // claims
  createCollection = "ixo.claims.v1beta1.CollectionCreatedEvent",
  updateCollection = "ixo.claims.v1beta1.CollectionUpdatedEvent",
  submitClaim = "ixo.claims.v1beta1.ClaimSubmittedEvent",
  updateClaim = "ixo.claims.v1beta1.ClaimUpdatedEvent",
  disputeClaim = "ixo.claims.v1beta1.ClaimDisputedEvent",
  // claims v7
  disputeResolved = "ixo.claims.v1beta1.DisputeResolvedEvent",
  memberBudgetCreated = "ixo.claims.v1beta1.MemberBudgetCreatedEvent",
  memberBudgetUpdated = "ixo.claims.v1beta1.MemberBudgetUpdatedEvent",
  memberBudgetRemoved = "ixo.claims.v1beta1.MemberBudgetRemovedEvent",
  agentDepositBalanceCreated = "ixo.claims.v1beta1.AgentDepositBalanceCreatedEvent",
  agentDepositBalanceUpdated = "ixo.claims.v1beta1.AgentDepositBalanceUpdatedEvent",
  agentDepositBalanceRemoved = "ixo.claims.v1beta1.AgentDepositBalanceRemovedEvent",
  // names v7
  namespaceCreated = "ixo.names.v1beta1.NamespaceCreatedEvent",
  namespaceUpdated = "ixo.names.v1beta1.NamespaceUpdatedEvent",
  nameRegistered = "ixo.names.v1beta1.NameRegisteredEvent",
  nameUpdated = "ixo.names.v1beta1.NameUpdatedEvent",
  nameTransferred = "ixo.names.v1beta1.NameTransferredEvent",
  nameStatusChanged = "ixo.names.v1beta1.NameStatusChangedEvent",
  // liquidstake v7
  lsModuleParamsUpdated = "ixo.liquidstake.v1beta1.ModuleParamsUpdatedEvent",
  lsPoolCreated = "ixo.liquidstake.v1beta1.PoolCreatedEvent",
  lsPoolUpdated = "ixo.liquidstake.v1beta1.PoolUpdatedEvent",
  lsStake = "ixo.liquidstake.v1beta1.LiquidStakeEvent",
  lsUnstake = "ixo.liquidstake.v1beta1.LiquidUnstakeEvent",
  lsAddLiquidValidator = "ixo.liquidstake.v1beta1.AddLiquidValidatorEvent",
  lsRebalanced = "ixo.liquidstake.v1beta1.RebalancedLiquidStakeEvent",
  lsAutoCompound = "ixo.liquidstake.v1beta1.AutocompoundStakingRewardsEvent",
  // token
  createToken = "ixo.token.v1beta1.TokenCreatedEvent",
  updateToken = "ixo.token.v1beta1.TokenUpdatedEvent",
  mintToken = "ixo.token.v1beta1.TokenMintedEvent",
  // bonds
  createBond = "ixo.bonds.v1beta1.BondCreatedEvent",
  updateBond = "ixo.bonds.v1beta1.BondUpdatedEvent",
  setNextAlphaBond = "ixo.bonds.v1beta1.BondSetNextAlphaEvent",
  buyOrderBond = "ixo.bonds.v1beta1.BondBuyOrderEvent",
  sellOrderBond = "ixo.bonds.v1beta1.BondSellOrderEvent",
  swapOrderBond = "ixo.bonds.v1beta1.BondSwapOrderEvent",
  outcomePaymentBond = "ixo.bonds.v1beta1.BondMakeOutcomePaymentEvent",
  shareWithdrawalBond = "ixo.bonds.v1beta1.BondWithdrawShareEvent",
  reserveWithdrawalBond = "ixo.bonds.v1beta1.BondWithdrawReserveEvent",
}

export const EventTypesArray = Object.values(EventTypes) as string[];

export const EventTypesAttributeKey: { [key in EventTypes]: string } = {
  [EventTypes.createIid]: "iidDocument",
  [EventTypes.updateIid]: "iidDocument",
  [EventTypes.createEntity]: "entity",
  [EventTypes.updateEntity]: "entity",
  [EventTypes.createCollection]: "collection",
  [EventTypes.updateCollection]: "collection",
  [EventTypes.submitClaim]: "claim",
  [EventTypes.updateClaim]: "claim",
  [EventTypes.disputeClaim]: "dispute",
  // claims v7
  [EventTypes.disputeResolved]: "dispute",
  [EventTypes.memberBudgetCreated]: "budget",
  [EventTypes.memberBudgetUpdated]: "budget",
  [EventTypes.memberBudgetRemoved]: "budget",
  [EventTypes.agentDepositBalanceCreated]: "balance",
  [EventTypes.agentDepositBalanceUpdated]: "balance",
  [EventTypes.agentDepositBalanceRemoved]: "balance",
  // names v7
  [EventTypes.namespaceCreated]: "namespace",
  [EventTypes.namespaceUpdated]: "namespace",
  [EventTypes.nameRegistered]: "record",
  [EventTypes.nameUpdated]: "record",
  // NameTransferredEvent / NameStatusChangedEvent emit flat scalar attrs, no
  // wrapped doc — handlers read them via getValueFromAttributes instead.
  [EventTypes.nameTransferred]: "namespace",
  [EventTypes.nameStatusChanged]: "namespace",
  // liquidstake v7
  [EventTypes.lsModuleParamsUpdated]: "module_params",
  [EventTypes.lsPoolCreated]: "pool",
  [EventTypes.lsPoolUpdated]: "pool",
  // Stake/Unstake/Autocompound/Rebalance/AddValidator emit flat attrs read
  // individually in the handler; the entry below is for completeness only.
  [EventTypes.lsStake]: "delegator",
  [EventTypes.lsUnstake]: "delegator",
  [EventTypes.lsAddLiquidValidator]: "validator",
  [EventTypes.lsRebalanced]: "delegator",
  [EventTypes.lsAutoCompound]: "delegator",
  [EventTypes.createToken]: "token",
  [EventTypes.updateToken]: "token",
  [EventTypes.mintToken]: "tokenProperties",
  [EventTypes.createBond]: "bond",
  [EventTypes.updateBond]: "bond",
  [EventTypes.setNextAlphaBond]: "next_alpha",
  [EventTypes.buyOrderBond]: "order",
  [EventTypes.sellOrderBond]: "order",
  [EventTypes.swapOrderBond]: "order",
  [EventTypes.outcomePaymentBond]: "outcome_payment",
  [EventTypes.shareWithdrawalBond]: "shareWithdrawalBond",
  [EventTypes.reserveWithdrawalBond]: "reserveWithdrawalBond",
};

export type Attribute = {
  key: string;
  value: string;
};
