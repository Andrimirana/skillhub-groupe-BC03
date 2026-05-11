/**
 * Script d'initialisation MongoDB pour SkillHub
 * Crée les collections et les index nécessaires
 */

// Basculer vers la base de données skillhub_logs
db = db.getSiblingDB("skillhub_logs");

// Collection pour les logs d'activité
db.createCollection("activity_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "userEmail", "action", "timestamp"],
      properties: {
        _id: { bsonType: "objectId" },
        userId: {
          bsonType: "string",
          description: "ID unique de l'utilisateur",
        },
        userEmail: {
          bsonType: "string",
          description: "Email de l'utilisateur",
        },
        action: {
          bsonType: "string",
          description: "Type d'action (login, view, complete, etc)",
          enum: [
            "login",
            "logout",
            "formation_view",
            "module_view",
            "module_complete",
            "resource_download",
            "rating_submitted",
            "certificate_generated",
          ],
        },
        resourceType: {
          bsonType: ["string", "null"],
          description: "Type de ressource affectée",
        },
        resourceId: {
          bsonType: ["string", "null"],
          description: "ID de la ressource affectée",
        },
        resourceTitle: {
          bsonType: ["string", "null"],
          description: "Titre de la ressource affectée",
        },
        details: {
          bsonType: ["object", "null"],
          description: "Détails additionnels de l'action",
        },
        timestamp: {
          bsonType: "date",
          description: "Horodatage de l'action",
        },
        ipAddress: {
          bsonType: ["string", "null"],
          description: "Adresse IP du client",
        },
        userAgent: {
          bsonType: ["string", "null"],
          description: "User agent du navigateur",
        },
        duration: {
          bsonType: ["int", "double", "null"],
          description: "Durée en secondes",
        },
      },
    },
  },
});

// Créer les index pour activity_logs
db.activity_logs.createIndex({ userId: 1, timestamp: -1 });
db.activity_logs.createIndex({ userEmail: 1 });
db.activity_logs.createIndex({ action: 1, timestamp: -1 });
db.activity_logs.createIndex({ resourceId: 1 });
db.activity_logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 jours

// Collection pour les sessions
db.createCollection("sessions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "sessionToken", "expiresAt"],
      properties: {
        _id: { bsonType: "objectId" },
        userId: {
          bsonType: "string",
          description: "ID unique de l'utilisateur",
        },
        sessionToken: {
          bsonType: "string",
          description: "Token de session unique",
        },
        userRole: {
          bsonType: ["string", "null"],
          description: "Rôle de l'utilisateur",
          enum: ["apprenant", "formateur", "admin", null],
        },
        expiresAt: {
          bsonType: "date",
          description: "Date d'expiration de la session",
        },
        createdAt: {
          bsonType: "date",
          description: "Date de création de la session",
        },
        ipAddress: {
          bsonType: ["string", "null"],
          description: "Adresse IP de la session",
        },
      },
    },
  },
});

// Index pour sessions avec expiration automatique
db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ sessionToken: 1 }, { unique: true });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Collection pour les analytics
db.createCollection("analytics", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["metricType", "value", "date"],
      properties: {
        _id: { bsonType: "objectId" },
        date: {
          bsonType: "date",
          description: "Date de la métrique",
        },
        metricType: {
          bsonType: "string",
          description: "Type de métrique",
          enum: [
            "user_registrations",
            "formations_created",
            "completion_rate",
            "avg_rating",
            "active_users",
            "formations_started",
          ],
        },
        value: {
          bsonType: ["int", "double"],
          description: "Valeur de la métrique",
        },
        dimension: {
          bsonType: ["string", "null"],
          description: "Dimension de la métrique",
        },
        dimensionValue: {
          bsonType: ["string", "null"],
          description: "Valeur de la dimension",
        },
        metadata: {
          bsonType: ["object", "null"],
          description: "Métadonnées additionnelles",
        },
      },
    },
  },
});

// Index pour analytics
db.analytics.createIndex({ metricType: 1, date: -1 });
db.analytics.createIndex({ dimension: 1, dimensionValue: 1 });
db.analytics.createIndex({ date: 1 });

// Collection pour les certifications générées
db.createCollection("certificates", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "formationId", "generatedAt"],
      properties: {
        _id: { bsonType: "objectId" },
        userId: {
          bsonType: "string",
          description: "ID de l'utilisateur",
        },
        formationId: {
          bsonType: "string",
          description: "ID de la formation",
        },
        formationTitle: {
          bsonType: ["string", "null"],
          description: "Titre de la formation",
        },
        certificateNumber: {
          bsonType: "string",
          description: "Numéro unique du certificat",
        },
        generatedAt: {
          bsonType: "date",
          description: "Date de génération",
        },
        completionDate: {
          bsonType: "date",
          description: "Date de fin de la formation",
        },
        score: {
          bsonType: ["double", "null"],
          description: "Score final",
        },
        instructorName: {
          bsonType: ["string", "null"],
          description: "Nom du formateur",
        },
        downloadedAt: {
          bsonType: ["date", "null"],
          description: "Date du téléchargement",
        },
      },
    },
  },
});

// Index pour certificates
db.certificates.createIndex({ userId: 1 });
db.certificates.createIndex({ formationId: 1 });
db.certificates.createIndex({ certificateNumber: 1 }, { unique: true });
db.certificates.createIndex({ generatedAt: -1 });

// Collection pour les progès utilisateur
db.createCollection("user_progress", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "formationId"],
      properties: {
        _id: { bsonType: "objectId" },
        userId: {
          bsonType: "string",
          description: "ID de l'utilisateur",
        },
        formationId: {
          bsonType: "string",
          description: "ID de la formation",
        },
        completedModules: {
          bsonType: "array",
          description: "Modules complétés",
          items: {
            bsonType: "object",
            properties: {
              moduleId: { bsonType: "string" },
              completedAt: { bsonType: "date" },
            },
          },
        },
        progressPercentage: {
          bsonType: ["double", "int"],
          description: "Pourcentage de progression",
        },
        rating: {
          bsonType: ["double", "int", "null"],
          description: "Note donnée par l'utilisateur (1-5)",
        },
        startedAt: {
          bsonType: "date",
          description: "Date de début",
        },
        lastAccessedAt: {
          bsonType: "date",
          description: "Dernier accès",
        },
        totalTimeSpent: {
          bsonType: ["int", "double"],
          description: "Temps total en secondes",
        },
      },
    },
  },
});

// Index pour user_progress
db.user_progress.createIndex({ userId: 1, formationId: 1 }, { unique: true });
db.user_progress.createIndex({ formationId: 1, progressPercentage: -1 });

// Afficher les collections créées
print("✅ Collections MongoDB créées avec succès:");
print("   - activity_logs");
print("   - sessions");
print("   - analytics");
print("   - certificates");
print("   - user_progress");
print("\n✅ Index créés pour optimiser les requêtes");
