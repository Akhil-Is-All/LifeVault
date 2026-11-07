const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const reminderRoutes = require("./routes/reminderRoutes");

dotenv.config();

const app = express();
app.use(cors());

app.use(express.json());
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("LifeVault API is running!");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "LifeVault backend is working!",
  });
});

app.use("/api/reminders", reminderRoutes);

async function startServer() {
    await connectDB();
  
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
  
  startServer();