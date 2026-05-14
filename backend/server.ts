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
    origin:
      process.env.NODE_ENV === "development"
        ? process.env.ALLOWED_DEV_ORIGIN
        : process.env.ALLOWED_PROD_ORIGIN,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use("/api", UserRoutes);
app.use("/api", CompanyRoutes);
app.use("/api", EmpenhoRoutes);
app.use("/api", NotaFiscalRoutes);

app.listen(process.env.PORT, () => {
  console.log(
    `${process.env.NODE_ENV === "development" ? "development" : "production"} server running on port ${process.env.PORT}`,
  );
});
