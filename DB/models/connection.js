import mongoose from "mongoose";
const connection = async () => {
  const url = process.env.DATABASE_CONNECTION_STRING;
  await mongoose
    .connect(url, {
      serverSelectionTimeoutMS: 20000,
    })
    .then(() => {
      console.log(`DB connected successfully`);
    })
    .catch((err) => {
      console.log(`check Your Connection ${err}`);
    });
};

export default connection;