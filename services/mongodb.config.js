/**
 * Configuration MongoDB pour SkillHub
 * Gère les logs d'activité et les analytics
 */

const mongoose = require("mongoose");

// URL de connexion MongoDB
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/skillhub";

// Connexion à MongoDB
async function connectMongoDB() {
  try {
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connecté avec succès");
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB:", error);
    process.exit(1);
  }
}

// Schéma pour les logs d'activité
const activityLogSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, required: true },
  action: { type: String, required: true }, // 'login', 'formation_view', 'module_complete', etc
  resourceType: { type: String }, // 'formation', 'module', 'user'
  resourceId: { type: String },
  resourceTitle: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  duration: { type: Number }, // en secondes
});

// Schéma pour les sessions
const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  sessionToken: { type: String, required: true, unique: true },
  userRole: { type: String, enum: ["apprenant", "formateur"] },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  createdAt: { type: Date, default: Date.now },
  ipAddress: { type: String },
});

// Schéma pour les analytics
const analyticsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, index: true },
  metricType: { type: String }, // 'user_registrations', 'formations_created', 'completion_rate'
  value: { type: Number, required: true },
  dimension: { type: String }, // 'formation_id', 'category', 'level'
  dimensionValue: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
});

// Modèles
const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
const Session = mongoose.model("Session", sessionSchema);
const Analytics = mongoose.model("Analytics", analyticsSchema);

// Fonction pour enregistrer une activité
async function logActivity(userId, userEmail, action, details = {}) {
  try {
    const log = new ActivityLog({
      userId,
      userEmail,
      action,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
    });
    await log.save();
    console.log(`✅ Log enregistré: ${action}`);
  } catch (error) {
    console.error("❌ Erreur lors de l'enregistrement du log:", error);
  }
}

// Fonction pour créer une session
async function createSession(
  userId,
  sessionToken,
  userRole,
  expiresAt,
  ipAddress,
) {
  try {
    const session = new Session({
      userId,
      sessionToken,
      userRole,
      expiresAt,
      ipAddress,
    });
    await session.save();
    console.log(`✅ Session créée pour l'utilisateur: ${userId}`);
    return session;
  } catch (error) {
    console.error("❌ Erreur lors de la création de la session:", error);
  }
}

// Fonction pour enregistrer une métrique d'analytics
async function recordAnalytic(metricType, value, dimension, dimensionValue) {
  try {
    const analytic = new Analytics({
      metricType,
      value,
      dimension,
      dimensionValue,
    });
    await analytic.save();
    console.log(`✅ Métrique enregistrée: ${metricType}`);
  } catch (error) {
    console.error("❌ Erreur lors de l'enregistrement de la métrique:", error);
  }
}

// Fonction pour récupérer les logs d'activité d'un utilisateur
async function getUserActivityLogs(userId, limit = 50) {
  try {
    const logs = await ActivityLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit);
    return logs;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des logs:", error);
    return [];
  }
}

// Fonction pour récupérer les analytics
async function getAnalytics(metricType, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await Analytics.find({
      metricType,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    return analytics;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des analytics:", error);
    return [];
  }
}

module.exports = {
  connectMongoDB,
  ActivityLog,
  Session,
  Analytics,
  logActivity,
  createSession,
  recordAnalytic,
  getUserActivityLogs,
  getAnalytics,
};
