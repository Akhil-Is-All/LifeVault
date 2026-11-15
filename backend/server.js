const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const { initializeFirebaseAdmin } = require("./config/firebaseAdmin");
const NotificationDelivery = require("./models/NotificationDelivery");
const { startNotificationScheduler } = require("./jobs/notificationScheduler");
const authRoutes = require("./routes/authRoutes");

const reminderRoutes = require("./routes/reminderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

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
app.use("/api/notifications", notificationRoutes);

async function startServer() {
  await connectDB();

  try {
    await NotificationDelivery.createCollection();
  } catch (error) {
    if (error.code !== 48 && error.codeName !== "NamespaceExists") {
      throw error;
    }
  }

  await NotificationDelivery.createIndexes();
  initializeFirebaseAdmin();
  startNotificationScheduler();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});