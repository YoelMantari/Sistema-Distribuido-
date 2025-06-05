# ETAPA 1  ▸  Compilación con Maven + JDK 21.0.7
# -------------------------------------------------
# Imagen oficial Maven 3.9.9 con Temurin 21
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /app

# 1) Copiamos el POM para “cachear” dependencias
COPY pom.xml .

# 2) Pre-descargamos dependencias (acelera reconstrucciones)
RUN mvn dependency:go-offline -B

# 3) Copiamos el código y construimos el JAR
COPY src ./src
RUN mvn clean package -DskipTests -q


# -------------------------------------------------
# ETAPA 2  ▸  Runtime con JDK 21.0.7
# -------------------------------------------------
# Imagen JDK Temurin 21.0.7 basada en Ubuntu 22.04 (jammy)
FROM eclipse-temurin:21.0.7_6-jdk-jammy

WORKDIR /app

# 4) Copiamos el artefacto resultante
COPY --from=builder /app/target/servicio-ventas-0.0.1-SNAPSHOT.jar ./servicio-ventas.jar

# 5) Puerto que expone tu aplicación (ajústalo si cambias en Spring)
EXPOSE 8001

# 6) Comando de arranque
ENTRYPOINT ["java", "-jar", "servicio-ventas.jar"]
