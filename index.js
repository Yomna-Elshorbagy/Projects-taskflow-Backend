import express from "express";
import cors from "cors";
import { createServer } from "http";
import { bootstrap } from "./src/modules/bootstrap.js";
import appGateway from "./src/socket/app.gateway.js";

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
//===> for rate-limiting behind Vercel/Load Balancers==> to get the real user's IP from Vercel's proxy
app.set("trust proxy", 1);
app.use(cors());

app.get("/", (req, res) => {
  res.json({
    message: `Welcome to ${process.env.APPLICATION_NAME || 'Our'} Backend ❤️`,
  });
});

bootstrap(app);

const httpServer = createServer(app);

if (process.env.NODE_ENV !== "test") {
  appGateway.init(httpServer).then(() => {
    httpServer.listen(port, () => console.log(`Example app listening on port ${port} with WebSockets enabled!`));
  });
}

export default app;
