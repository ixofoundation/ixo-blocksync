export enum EventTypes {
  createIid = "ixo.iid.v1beta1.IidDocumentCreatedEvent",
  updateIid = "ixo.iid.v1beta1.IidDocumentUpdatedEvent",
  createEntity = "ixo.entity.v1beta1.EntityCreatedEvent",
  updateEntity = "ixo.entity.v1beta1.EntityUpdatedEvent",
  createCollection = "ixo.claims.v1beta1.CollectionCreatedEvent",
  updateCollection = "ixo.claims.v1beta1.CollectionUpdatedEvent",
  submitClaim = "ixo.claims.v1beta1.ClaimSubmittedEvent",
  updateClaim = "ixo.claims.v1beta1.ClaimUpdatedEvent",
  disputeClaim = "ixo.claims.v1beta1.ClaimDisputedEvent",
  createToken = "ixo.token.v1beta1.TokenCreatedEvent",
  updateToken = "ixo.token.v1beta1.TokenUpdatedEvent",
  mintToken = "ixo.token.v1beta1.TokenMintedEvent",
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
  [EventTypes.createToken]: "token",
  [EventTypes.updateToken]: "token",
  [EventTypes.mintToken]: "tokenProperties",
};
