import express from "express";
import { UserRoutes } from "./http/routes/UserRoutes.js";

const app = express();
app.use(express.json());
app.use("/api", UserRoutes);

app.listen(process.env.PORT, () => {
  console.log(`http://localhost:${process.env.PORT}`);
});
