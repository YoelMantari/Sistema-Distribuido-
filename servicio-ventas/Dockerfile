# Imagen base con Java 17
FROM openjdk:17-jdk-slim

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos el JAR generado (después de hacer mvn package)
COPY target/servicio-ventas-0.0.1-SNAPSHOT.jar /app/servicio-ventas.jar

# Expone el puerto donde corre la aplicación (configurado en application.properties)
EXPOSE 8001

# Comando de arranque
ENTRYPOINT ["java", "-jar", "servicio-ventas.jar"]
