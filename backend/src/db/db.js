const mongoose = require("mongoose");

async function connecDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("MongoDB connection err", err);
  }
}


module.exports = connecDB;