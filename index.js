import dotenv from "dotenv";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import Jwt from "jsonwebtoken";
import cors from "cors";
import { createServer } from "http";
import fileUpload from "express-fileupload";
import mongoDB from "./src/db/mongoDB.js";
import resolvers from "./src/graphql/typeResolver.js";
import typeDefs from "./src/graphql/typeDefs.js";
import { handleUpload } from "./src/middleware/index.js";
import { upload } from "./src/middleware/upload.js";

mongoDB();
dotenv.config();

const app = express();




app.use(express.json());
app.use(cors());
// app.use(fileUpload());

// app.use("/uploads", express.static("uploads"));

// app.post("/upload", upload);

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
  await server.start()
  app.use(
    "/graphql",
    cors(),
    expressMiddleware(server, {
      context: ({req}) => {    
        const authHeader = req?.headers?.authorization
        console.log(req.headers);
        
        if (!authHeader) {
          console.error('No se proporcionó un token')
          throw new Error('Token no proporcionado')
        }
        try {
            const decodedToken = Jwt.verify(authHeader, process.env.SECRET_KEY)
            req.user = decodedToken
            console.log("token verificado", decodedToken);
            
            return {user: decodedToken}
        } catch (error) {
         console.error('Token inválido o expirado', error.message);
          throw new Error('Token inválido o expirado');
        }
      },
    })
  );
};

const PORT = process.env.PORT || 4001;

httpServer.listen(PORT, () => {
  console.log(`El servidor se ejecuta en http://localhost:${PORT}/graphql`);
  console.log(
    `El servidor WebSocket se ejecuta en ws://localhost:${PORT}/graphql`
  );
});

serverStart();
 