# Blocksync

## Version: 1.0.0

### /

#### GET

##### Description:

Responds with 'API is Running'

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

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

GraphQL endpoint

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

Upload a file to web3.storage

##### Parameters

| Name        | Located in | Description | Required | Schema |
| ----------- | ---------- | ----------- | -------- | ------ |
| name        | body       |             | Yes      | string |
| contentType | body       |             | Yes      | string |
| data        | body       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /storage/retrieve/:cid

#### GET

##### Description:

Get the IPFS link for a web3.storage file

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| cid  | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/bonds/listBonds

#### GET

##### Description:

List all bonds

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

List all bonds with filter provided in request body

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

Get a bond by its DID

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

Get a bond's price history by its DID

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

Get all bonds created by a DID

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

Get all bonds for an account address

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

Get all payment outcomes for a bond DID

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

Get all alpha changes for a bond DID

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

Get all transactions for a bond DID

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

Get all transactions by a buyer DID

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

Get all reserve withdrawals for a bond DID

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

Get all reserve withdrawals by recipient DID

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

Get all share withdrawals for a bond DID

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

Get all share withdrawals by a recipient DID

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

List all projects

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

List all projects with filter provided in request body

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

Get projects by entity type

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

Get a project by its DID

##### Parameters

| Name       | Located in | Description | Required | Schema |
| ---------- | ---------- | ----------- | -------- | ------ |
| projectDid | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/project/getByProjectSenderDid/{senderDid}

#### GET

##### Description:

Get all projects by a sender DID

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

### /api/project/getProjectsByCreatedAndAgent/{did}

#### GET

##### Description:

Get all projects where the creator is also an agent by DID

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

### /api/project/shields/status/{projectDid}

#### GET

##### Description:

Get a project's status by its DID

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

Get all project accounts for a project DID

##### Parameters

| Name       | Located in | Description | Required | Schema |
| ---------- | ---------- | ----------- | -------- | ------ |
| projectDid | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### api/iid/getByIid/{iid}

#### GET

##### Description:

Get an IID document by its IID

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| iid  | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/event/getEventByType/{type}

#### GET

##### Description:

Get events by type

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

List all project related stats for the chain

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### api/transactions/listTransactionsByType/{type(\*)}

#### GET

##### Description:

List all transactions by type

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

### api/transactions/listTransactionsByAddress/{address}

#### GET

##### Description:

List all transactions by an address

##### Parameters

| Name    | Located in | Description | Required | Schema |
| ------- | ---------- | ----------- | -------- | ------ |
| address | path       |             | Yes      | string |
| page    | query      |             | No       | string |
| size    | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### api/transactions/listTransactionsByAddressAndType/{address}/{type(\*)}

#### GET

##### Description:

List all transactions by an address and type

##### Parameters

| Name     | Located in | Description | Required | Schema |
| -------- | ---------- | ----------- | -------- | ------ |
| address  | path       |             | Yes      | string |
| type(\*) | path       |             | Yes      | string |
| page     | query      |             | No       | string |
| size     | query      |             | No       | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/block/getLastSyncedBlock

#### GET

##### Description:

Get Blocksync's last synced block

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### api/block/getPaymentTemplateById/{id}

#### GET

##### Description:

Get a payment template by its ID

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| id   | path       |             | Yes      | string |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |

### /api/blockchain/txs

#### POST

##### Description:

Pass a transaction to the chain

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

Pass a sign data request to the chain

##### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| body | body       |             | No       | object |

##### Responses

| Code | Description |
| ---- | ----------- |
| 200  | OK          |
