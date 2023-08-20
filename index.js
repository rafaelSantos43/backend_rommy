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
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();
mongoDB();

const secretKey = "dahiana123";
const app = express();

app.use(express.json());
app.use(cors());
app.use(fileUpload());
app.use("/uploads", express.static("uploads"));

app.post("/upload", function (req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const uploadedFile = req.files.sampleFile;
  const uploadPath = path.join(__dirname, "uploads", uploadedFile.name);

  uploadedFile.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).send(err);
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      uploadedFile.name
    }`;
    res.json({ imageUrl });
  });
});

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

const PORT = process.env.PORT || 4001;

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
