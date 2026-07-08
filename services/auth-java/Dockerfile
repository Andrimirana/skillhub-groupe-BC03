# ── Stage 1 : Build Maven ────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copier pom.xml seul pour profiter du cache Docker des dépendances
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copier le reste du code et compiler
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2 : Image finale légère ────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copier le JAR généré depuis le stage build
COPY --from=build /app/target/*.jar app.jar

# Créer le dossier de logs
RUN mkdir -p logs

EXPOSE 8080

# Variables d'environnement (surchargées par docker-compose)
ENV APP_MASTER_KEY=""
ENV JWT_SECRET=""
ENV SPRING_DATASOURCE_URL=""
ENV SPRING_DATASOURCE_USERNAME="root"
ENV SPRING_DATASOURCE_PASSWORD=""

ENTRYPOINT ["java", "-jar", "app.jar"]
