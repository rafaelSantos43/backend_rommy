import dotenv from "dotenv";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import Jwt from "jsonwebtoken";
import cors from "cors";
import { createServer } from "http";

import mongoDB from "./src/db/mongoDB.js";
import resolvers from "./src/graphql/typeResolver.js";
import typeDefs from "./src/graphql/typeDefs.js";
//import upload from './src/storage/multerUp.js'
import multer from "multer";
import path from "path";

dotenv.config();
mongoDB();

const secretKey = "dahiana123";
const port = process.env.PORT || 4001;

const app = express();

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  const token = req.headers.token;
  if (token) {
    try {
      const decodedToken = Jwt.verify(token, secretKey);
      req.user = decodedToken;
    } catch (error) {
      // Manejo del error de token inválido o expirado
      console.error("Token inválido o expirado");
    }
  }
  next();
});

const httpServer = createServer(app);

const schema = makeExecutableSchema({ typeDefs, resolvers });

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

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

const serverCleanUp = useServer({ schema }, wsServer);

const serverStart = async () => {
  await server.start();
  app.use(
    "/graphql",
    cors(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
    })
  );
};

const PORT = 4000;
// Ahora que el servidor HTTP está completamente configurado, podemos escucharlo.
httpServer.listen(PORT, () => {
  console.log(`El servidor se ejecuta en http://localhost:${PORT}/graphql`);
  console.log(
    `El servidor WebSocket se ejecuta en ws://localhost:${PORT}/graphql`
  );
});

serverStart();
/*function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
  }

  const option = {
   expiresInt: "1h",
  }

  return Jwt.sign(payload, secretKey, option)
}*/

/*function verifyToken(){ 
  try {
    const decode = jwt.verify(token, secretKey)
    return decode
  } catch (error) {
    throw new Error('Token ivalido')
  }
}*/
