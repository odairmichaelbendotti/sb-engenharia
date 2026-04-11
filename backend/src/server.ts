import express from "express";
import { UserRoutes } from "./http/routes/UserRoutes.js";
import { CompanyRoutes } from "./http/routes/CompanyRoutes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { EmpenhoRoutes } from "./http/routes/EmpenhoRoutes.js";
import { NotaFiscalRoutes } from "./http/routes/NotaFiscalRoutes.js";

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
app.use("/api", CompanyRoutes);
app.use("/api", EmpenhoRoutes);
app.use("/api", NotaFiscalRoutes);

app.listen(process.env.PORT, () => {
  console.log(`http://localhost:${process.env.PORT}`);
});
