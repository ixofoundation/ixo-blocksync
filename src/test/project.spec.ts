const mockMongo = require('mongo-unit');
const testMongoUrl = process.env.MONGO_URL;

describe('Project functions', () => {
  beforeEach(() => mockMongo.initDb(testMongoUrl));
  afterEach(() => mockMongo.drop());

  //TODO
  /*  it('create new project entry', () => {
       let txn_handler = new TransactionHandler();
       loadJSON('project', function (data) {
           txn_handler.routeTransaction(data);

       })
   }); */
});
