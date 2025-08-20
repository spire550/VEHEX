import express from "express";
import dotenv from "dotenv";
import connection from "./DB/models/connection.js";
import userRouter from "./src/module/user/user.router.js";
import carRouter from "./src/module/car/car.router.js";
import productRouter from "./src/module/product/product.router.js";
import categoryRouter from "./src/module/category/category.router.js";
import cartRouter from "./src/module/cart/cart.router.js";
import packageRouter from "./src/module/package/package.router.js";
import orderRouter from "./src/module/order/order.router.js";
import messageRouter from "./src/module/message/message.router.js";
import bodyParser from "body-parser";
import cors from "cors";
dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

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
app.use("/product", productRouter);
app.use("/category", categoryRouter);
app.use("/cart", cartRouter);
app.use("/package", packageRouter);
app.use("/order", orderRouter);
app.use("/message", messageRouter);

app.use((err, req, res, next) => {
  return res.json({ message: "Error", err: err.message, stack: err.stack });
});
(async () => {
  await connection();
})();

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
