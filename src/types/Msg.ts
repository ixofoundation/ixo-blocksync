export enum MsgTypes {
    createIid = "ixo.iid.v1beta1.MsgCreateIidDocument",
    updateIid = "ixo.iid.v1beta1.MsgUpdateIidDocument",
    addVerification = "ixo.iid.v1beta1.MsgAddVerification",
    setVerificationRelationships = "ixo.iid.v1beta1.MsgSetVerificationRelationships",
    revokeVerification = "ixo.iid.v1beta1.MsgRevokeVerification",
    addService = "ixo.iid.v1beta1.MsgAddService",
    deleteService = "ixo.iid.v1beta1.MsgDeleteService",
    addAccordedRight = "ixo.iid.v1beta1.MsgDeleteService",
    deleteAccordedRight = "ixo.iid.v1beta1.MsgDeleteServiceResponse",
    addLinkedEntity = "ixo.iid.v1beta1.MsgAddLinkedEntity",
    deleteLinkedEntity = "ixo.iid.v1beta1.MsgDeleteLinkedEntity",
    addLinkedResource = "ixo.iid.v1beta1.MsgAddLinkedResource",
    deleteLinkedResource = "ixo.iid.v1beta1.MsgDeleteLinkedResource",
    addContext = "ixo.iid.v1beta1.MsgAddIidContext",
    deleteContext = "ixo.iid.v1beta1.MsgDeleteIidContext",
    updateMetadata = "ixo.iid.v1beta1.MsgUpdateIidMeta",
    createProject = "ixo.project.v1.MsgCreateProject",
    updateProjectStatus = "ixo.project.v1.MsgUpdateProjectStatus",
    updateProjectDoc = "ixo.project.v1.MsgUpdateProjectDoc",
    createAgent = "ixo.project.v1.MsgCreateAgent",
    updateAgent = "ixo.project.v1.MsgUpdateAgent",
    createClaim = "ixo.project.v1.MsgCreateClaim",
    evaluateClaim = "ixo.project.v1.MsgCreateEvaluation",
    createBond = "ixo.bonds.v1beta1.MsgCreateBond",
    editBond = "ixo.bonds.v1beta1.MsgEditBond",
    setNextAlpha = "ixo.bonds.v1beta1.MsgSetNextAlpha",
    updateBondState = "ixo.bonds.v1beta1.MsgUpdateBondState",
    buy = "ixo.bonds.v1beta1.MsgBuy",
    sell = "ixo.bonds.v1beta1.MsgSell",
    swap = "ixo.bonds.v1beta1.MsgSwap",
    makeOutcomePayment = "ixo.bonds.v1beta1.MsgMakeOutcomePayment",
    withdrawShare = "ixo.bonds.v1beta1.MsgWithdrawShare",
    withdrawReserve = "ixo.bonds.v1beta1.MsgWithdrawReserve",
    createPaymentTemplate = "ixo.payments.v1.MsgCreatePaymentTemplate",
    createPaymentContract = "ixo.payments.v1.MsgCreatePaymentContract",
    createSubscription = "ixo.payments.v1.MsgCreateSubscription",
    setPaymentContractAuthorisation = "ixo.payments.v1.MsgSetPaymentContractAuthorisation",
    grantDiscount = "ixo.payments.v1.MsgGrantDiscount",
    revokeDiscount = "ixo.payments.v1.MsgRevokeDiscount",
    effectPayment = "ixo.payments.v1.MsgEffectPayment",
    storeCode = "wasm/MsgStoreCode",
    instantiateContract = "wasm/MsgInstantiateContract",
    migrateContract = "wasm/MsgMigrateContract",
    clearAdmin = "wasm/MsgClearAdmin",
    updateAdmin = "wasm/MsgUpdateAdmin",
    executeContract = "wasm/MsgExecuteContract",
}
