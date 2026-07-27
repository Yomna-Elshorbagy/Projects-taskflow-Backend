import express from "express";
import cors from "cors";
import { bootstrap } from "./src/modules/bootstrap.js";

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({
    message: `Welcome to ${process.env.APPLICATION_NAME || 'Our'} Backend ❤️`,
  });
});

bootstrap(app);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
