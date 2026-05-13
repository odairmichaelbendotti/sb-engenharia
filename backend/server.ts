import express from "express";
import { UserRoutes } from "./src/http/routes/UserRoutes.js";
import { CompanyRoutes } from "./src/http/routes/CompanyRoutes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { EmpenhoRoutes } from "./src/http/routes/EmpenhoRoutes.js";
import { NotaFiscalRoutes } from "./src/http/routes/NotaFiscalRoutes.js";

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
  console.log(`http://74.50.67.174:${process.env.PORT}`);
});
