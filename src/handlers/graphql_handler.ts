import * as graphqlHTTP from 'express-graphql';
import { buildSchema } from 'graphql';
import { ProjectHandler } from './project_handler';

//import { ProjectDB } from '../db/models/project';

var schema = buildSchema(`
  type Query {
    projects: [Project]!
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
}
`);

var root = { 
  projects: async () => {
    console.log("call projects"); 
    let projects = await (new ProjectHandler()).listAllProjects();
    console.log(projects);
    return projects}
};

export class GraphQLHandler {

  configure = (app: any) => {

    app.use('/graphql', graphqlHTTP({
      schema: schema,
      rootValue: root,
      graphiql: true,
    }));
  
  }

}
