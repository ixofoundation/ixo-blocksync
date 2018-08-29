import * as graphqlHTTP from 'express-graphql';
import { buildSchema } from 'graphql';
import { ProjectHandler } from './project_handler';
import { ProjectSyncHandler } from '../sync_handlers/project_sync_handler';
import { PubSub } from 'graphql-subscriptions';

//import { ProjectDB } from '../db/models/project';

// TODO: Get subscriptions working, check express-graphql PR for adding subscriptions to their NPM package, once that's implemented this can continue
// https://github.com/graphql/express-graphql/pull/436#issue-186508682
// http://www.lbxhq.com/graphql-js/9-subscriptions/
// Graphcool can be used for easier filtering, investigate -> https://www.graph.cool/
/* ================= ================= */
// graphiql queries below
/* ================= ================= */
/* query {
	projects(filter: {projectDid: "did:ixo:41ebk3JMGTdWEfLTsSrksa"}) {
	  data {
		title
		ownerName
		agentStats {
		  evaluators
		  evaluatorsPending
		  serviceProviders
		  serviceProvidersPending
		}
		agents {
		  did
		  status
		  kyc
		  role
		}
	  }
	  projectDid
	}
  }
  
  # mutation {
  #   addAgent(projectDid: "did:ixo:41ebk3JMGTdWEfLTsSrksa", did: "did:sov:8u6A31iJAcfVNfgEH2gn77", status: "0", kyc: true, role: "IA") {
  #     projectDid
  #     did
  #     status
  #     kyc
  #     role
  #   }
  # }
  
  # {
  #   users {
  #     name
  #   }
  # }
*/
/* ================= ================= */
// graphiql queries above
/* ================= ================= */

const pubsub = new PubSub();
const PORT = 8080;
const subscriptionsEndpoint = `ws://localhost:${PORT}/subscriptions`;

export const schema = buildSchema(`
type Query {
	projects(filter: DidFilterInput): [Project!]!,
	users: [User!]!
}

input DidFilterInput {
	projectDid: String
}

type User {
	name: String
	age: Int
}

type Project {
	projectDid: String
	data: ProjectData
}
type ProjectData {
    title: String
    ownerName: String
    ownerEmail: String
    shortDescription: String
    longDescription: String
    impactAction: String
    projectLocation: String
    sdgs: [String]
    requiredClaims: String
    evaluatorPayPerClaim: String
    serviceEndpoint: String
    imageLink: String
    createdOn: String
	createdBy: String
	agentStats: AgentStats
	agents: [Agent]
}

type AgentStats {
	evaluators: Int
	evaluatorsPending: Int
	serviceProviders: Int
	serviceProvidersPending: Int
}

type Agent {
	did: String
	status: String
	kyc: Boolean
	role: String
	projectDid: String
}

type Mutation {
	addAgent(projectDid: String!, did: String!, status: String!, kyc: Boolean!, role: String!): Agent
}

type Subscription {
	Agent(filter: AgentSubscriptionFilter): AgentSubscriptionPayload
  }
  
  input AgentSubscriptionFilter {
	mutation_in: [_ModelMutationType!]
  }
  
  type AgentSubscriptionPayload {
	mutation: _ModelMutationType!
	node: Agent
  }
  
  enum _ModelMutationType {
	CREATED
	UPDATED
	DELETED
  }

`);

// data(title: String): ProjectData

var root = { 
	Subscription: {
		Agent: {
		subscribe: () => pubsub.asyncIterator('Agent'),
		}
	},
	addAgent: async({projectDid, did, status, kyc, role}) => {
		console.log("Project did is: ", projectDid);
		const newAgent = Object.assign({did, status, kyc, role, projectDid});
		const response = await (new ProjectSyncHandler()).addAgent(projectDid, {did: did, status: status, kyc: kyc, role: role});
		pubsub.publish('Agent', {Agent: {mutation: 'CREATED', node: newAgent}});
		return response;

	},
	projects: async ({filter}) => {
		console.log("call projects"); 
		// if(args.projectDid !== undefined && args.projectDid.length > 0) {
			// return await (new ProjectHandler()).listAllProjects();
		// 	return await (new ProjectHandler()).listProjectByProjectDid();
		// } else {
			return await (new ProjectHandler()).listProjects(filter);
		// }
			// return (
			// 	[{
			// 		"data": {
			// 		  "title": "test regeneration" + args.title + "yes",
			// 		  "ownerName": "Jodie Franco"
			// 		}
			// 	}	]
			// );
		// }
		// console.log(projects);
		// return projects},
	},
	users() {
		return [
			{name: 'test', age: 36},
			{name: 'john', age: 25},
			{name: 'peter', age: 29},
		]
	}

};

export class GraphQLHandler {

  configure = (app) => {

    app.use('/graphql', graphqlHTTP({
      schema: schema,
      rootValue: root,
	  graphiql: true,
	  subscriptionsEndpoint: subscriptionsEndpoint
	}));
  }

}
