import express from "express";
import { UserRoutes } from "./http/routes/UserRoutes.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use("/api", UserRoutes);

app.listen(process.env.PORT, () => {
  console.log(`http://localhost:${process.env.PORT}`);
});
