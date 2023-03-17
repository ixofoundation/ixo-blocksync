# Blocksync

## Version: 1.0.0

### /graphiql

#### GET

##### Description:

GraphiQL IDE

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /graphql

#### POST

##### Description:

GraphQL

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /storage/store

#### POST

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| body | body       |             | No       | object |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /storage/retrieve/{cid}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| cid  | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/entity/byId/{id}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id   | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/entity/all

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/entity/byType/{type}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| type | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/entity/byOwnerAddress/{address}

#### GET

##### Description:

##### Parameters

| Name    | Located in | Description | Required | Schema |
| ------- | ---------- | ----------- | -------- | ------ |
| address | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/entity/collections

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/entity/collectionById/{id}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id   | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/entity/collectionsByOwnerAddress/{address}

#### GET

##### Description:

##### Parameters

| Name    | Located in | Description | Required | Schema |
| ------- | ---------- | ----------- | -------- | ------ |
| address | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/entity/owner/{id}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id   | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/tokenclass/contractaddress/{contractAddress}

#### GET

##### Description:

##### Parameters

| Name            | Located in | Description | Required | Schema |
| --------------- | ---------- | ----------- | -------- | ------ |
| contractAddress | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/tokenclass/name/{name}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| name | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/tokenclass/class/{id}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id   | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/token/name/{name}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| name | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/token/id/{id}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id   | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/token/entity/{id}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id   | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/token/collection/{id}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id   | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/token/mintauth/{granter}/{grantee}

#### GET

##### Description:

##### Parameters

| Name    | Located in | Description | Required | Schema |
| ------- | ---------- | ----------- | -------- | ------ |
| granter | path       |             | Yes      | string |
| grantee | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bonds/listBonds

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| page | query      |             | No       | string |
| size | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bonds/listBondsFiltered

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| page | query      |             | No       | string |
| size | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bonds/getByBondDid/{bondDid}

#### GET

##### Description:

##### Parameters

| Name    | Located in | Description | Required | Schema |
| ------- | ---------- | ----------- | -------- | ------ |
| bondDid | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bonds/getPriceHistoryByBondDid/{bondDid}

#### GET

##### Description:

##### Parameters

| Name    | Located in | Description | Required | Schema |
| ------- | ---------- | ----------- | -------- | ------ |
| bondDid | path       |             | Yes      | string |
| page    | query      |             | No       | string |
| size    | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bonds/getByBondCreatorDid/{creatorDid}

#### GET

##### Description:

##### Parameters

| Name       | Located in | Description | Required | Schema |
| ---------- | ---------- | ----------- | -------- | ------ |
| creatorDid | path       |             | Yes      | string |
| page       | query      |             | No       | string |
| size       | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bonds/getAccountBonds/{account}

#### GET

##### Description:

##### Parameters

| Name    | Located in | Description | Required | Schema |
| ------- | ---------- | ----------- | -------- | ------ |
| account | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bond/get/outcomepayments/{bonddid}

#### GET

##### Description:

##### Parameters

| Name    | Located in | Description | Required | Schema |
| ------- | ---------- | ----------- | -------- | ------ |
| bonddid | path       |             | Yes      | string |
| page    | query      |             | No       | string |
| size    | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bond/get/alphas/{bonddid}

#### GET

##### Description:

##### Parameters

| Name    | Located in | Description | Required | Schema |
| ------- | ---------- | ----------- | -------- | ------ |
| bonddid | path       |             | Yes      | string |
| page    | query      |             | No       | string |
| size    | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bond/get/transactions/{bonddid}

#### GET

##### Description:

##### Parameters

| Name    | Located in | Description | Required | Schema |
| ------- | ---------- | ----------- | -------- | ------ |
| bonddid | path       |             | Yes      | string |
| page    | query      |             | No       | string |
| size    | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bond/get/transactions/bybuyerdid/{buyerdid}

#### GET

##### Description:

##### Parameters

| Name     | Located in | Description | Required | Schema |
| -------- | ---------- | ----------- | -------- | ------ |
| buyerdid | path       |             | Yes      | string |
| page     | query      |             | No       | string |
| size     | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bond/get/withdraw/reserve/bybonddid/{bonddid}

#### GET

##### Description:

##### Parameters

| Name    | Located in | Description | Required | Schema |
| ------- | ---------- | ----------- | -------- | ------ |
| bonddid | path       |             | Yes      | string |
| page    | query      |             | No       | string |
| size    | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bond/get/withdraw/reserve/byrecipientdid/{recipientdid}

#### GET

##### Description:

##### Parameters

| Name         | Located in | Description | Required | Schema |
| ------------ | ---------- | ----------- | -------- | ------ |
| recipientdid | path       |             | Yes      | string |
| page         | query      |             | No       | string |
| size         | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bond/get/withdraw/share/bybondid/{bonddid}

#### GET

##### Description:

##### Parameters

| Name    | Located in | Description | Required | Schema |
| ------- | ---------- | ----------- | -------- | ------ |
| bonddid | path       |             | Yes      | string |
| page    | query      |             | No       | string |
| size    | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bond/get/withdraw/share/byrecipientdid/{recipientdid}

#### GET

##### Description:

##### Parameters

| Name         | Located in | Description | Required | Schema |
| ------------ | ---------- | ----------- | -------- | ------ |
| recipientdid | path       |             | Yes      | string |
| page         | query      |             | No       | string |
| size         | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/project/listProjects

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| page | query      |             | No       | string |
| size | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/project/listProjectsFiltered

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| page | query      |             | No       | string |
| size | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/project/getByEntityType/{entityType}

#### GET

##### Description:

##### Parameters

| Name       | Located in | Description | Required | Schema |
| ---------- | ---------- | ----------- | -------- | ------ |
| entityType | path       |             | Yes      | string |
| page       | query      |             | No       | string |
| size       | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/project/getByProjectDid/{projectDid}

#### GET

##### Description:

##### Parameters

| Name       | Located in | Description | Required | Schema |
| ---------- | ---------- | ----------- | -------- | ------ |
| projectDid | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/project/getProjectsByCreatedAndAgent/{did}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| did  | path       |             | Yes      | string |
| page | query      |             | No       | string |
| size | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/project/getByProjectSenderDid/{senderDid}

#### GET

##### Description:

##### Parameters

| Name      | Located in | Description | Required | Schema |
| --------- | ---------- | ----------- | -------- | ------ |
| senderDid | path       |             | Yes      | string |
| page      | query      |             | No       | string |
| size      | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/project/shields/status/{projectDid}

#### GET

##### Description:

##### Parameters

| Name       | Located in | Description | Required | Schema |
| ---------- | ---------- | ----------- | -------- | ------ |
| projectDid | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/project/getProjectAccounts/{projectDid}

#### GET

##### Description:

##### Parameters

| Name       | Located in | Description | Required | Schema |
| ---------- | ---------- | ----------- | -------- | ------ |
| projectDid | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/iid/getByIid/{iid}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| iid  | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/did/getByDid/{did}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| did  | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/event/getEventByType/{type}

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| type | path       |             | Yes      | string |
| page | query      |             | No       | string |
| size | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/stats/listStats

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/transactions/listTransactionsByType/{type(\*)}

#### GET

##### Description:

##### Parameters

| Name     | Located in | Description | Required | Schema |
| -------- | ---------- | ----------- | -------- | ------ |
| type(\*) | path       |             | Yes      | string |
| page     | query      |             | No       | string |
| size     | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/transactions/getLatestTransactions/{address}

#### GET

##### Description:

##### Parameters

| Name    | Located in | Description | Required | Schema |
| ------- | ---------- | ----------- | -------- | ------ |
| address | query      |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/block/getLastSyncedBlock

#### GET

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/blockchain/txs

#### POST

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/sign_data

#### POST

##### Description:

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| body | body       |             | No       | object |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |
