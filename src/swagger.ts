import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        title: "Blocksync",
    },
    host: "",
    basePath: "",
    paths: {
        "/graphiql": {
            get: {
                description: "GraphiQL IDE",
                parameters: [],
                responses: {
                    "200": {
                        description: "OK",
                    },
                },
            },
        },
        "/graphql": {
            post: {
                description: "GraphQL",
                parameters: [],
                responses: {
                    "200": {
                        description: "OK",
                    },
                },
            },
        },
    },
};

const outputFile = "swagger.json";
const endpointsFiles = ["src/app.ts"];

swaggerAutogen()(outputFile, endpointsFiles, doc);
