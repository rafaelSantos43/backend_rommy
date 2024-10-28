import Jwt from "jsonwebtoken";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import typeDefs from "../graphql/typeDefs.js";
import resolvers from "../graphql/typeResolver.js";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import cors from "cors"
import express from "express";

const app = express()
const httpServer = createServer(app)
app.use(cors())

export const serverStart = async () => {
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  const serverCleanUp = useServer({ schema }, wsServer);

  const server = new ApolloServer({
    schema,
    uploads: false,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanUp.dispose();
            },
          };
        },
      },
    ],
  });
  await server.start();
  app.use(
    "/graphql",
    cors(),
    expressMiddleware(server, {
      context: ({ req }) => {
        const authHeader = req?.headers?.authorization;
        if (!authHeader) {
          console.error("No se proporcionó un token");
          throw new Error("Token no proporcionado");
        }
        try {
          const decodedToken = Jwt.verify(authHeader, process.env.SECRET_KEY);
          req.user = decodedToken;
          console.log("el token a sido verificado");
          return { user: decodedToken };
        } catch (error) {
          console.error("Token inválido o expirado", error.message);
          throw new Error("Token inválido o expirado");
        }
      },
    })
  );
};
