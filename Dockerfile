# Multi-stage Docker build for Railway / Cloud Deployment from repository root
# Stage 1: Build Spring Boot JAR
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal Java 17 Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/rcm-insight-backend-1.0.0.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
