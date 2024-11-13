import express from "express";
import dotenv from "dotenv";
import connection from "./DB/models/connection.js";
import userRouter from "./src/module/user/user.router.js";
import carRouter from "./src/module/car/car.router.js";

dotenv.config();
const app = express();
const whitelist = [];

app.use((req, res, next) => {
  console.log(req.header("origin"));
  /*if (!whitelist.includes(req.header("origin"))) {
    return next(new Error("Blocked"));
  }*/
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Private-Network", true);
  return next();
});
const port = process.env.PORT;
app.use(express.json());
app.use("/user", userRouter);
app.use("/car", carRouter);


app.use((err, req, res, next) => {
  return res.json({ message: "Error", err: err.message, stack: err.stack });
});
await connection();

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
