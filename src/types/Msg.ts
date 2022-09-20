export enum WasmMsgTypes {
    storeCode = "wasm/MsgStoreCode",
    instantiateContract = "wasm/MsgInstantiateContract",
    migrateContract = "wasm/MsgMigrateContract",
    clearAdmin = "wasm/MsgClearAdmin",
    updateAdmin = "wasm/MsgUpdateAdmin",
    executeContract = "wasm/MsgExecuteContract",
}

export enum MsgTypes {
    addDid = "did/AddDid",
    addCredential = "did/AddCredential",
    createBond = "bonds/MsgCreateBond",
    buy = "bonds/MsgBuy",
    makeOutcomePayment = "bonds/MsgMakeOutcomePayment",
    withdrawShare = "bonds/MsgWithdrawShare",
    setNextAlpha = "bonds/MsgSetNextAlpha",
    editAlphaSuccess = "bonds/EditAlphaSuccess",
    withdrawReserve = "bonds/MsgWithdrawReserve",
    priceChange = "bonds/price_change",
    createProject = "project/CreateProject",
    createAgent = "project/CreateAgent",
    updateAgent = "project/UpdateAgent",
    createClaim = "project/CreateClaim",
    evaluateClaim = "project/CreateEvaluation",
    updateProjectStatus = "project/UpdateProjectStatus",
    updateProjectDoc = "project/UpdateProjectDoc",
}