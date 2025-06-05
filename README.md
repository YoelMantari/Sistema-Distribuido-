# README

Este documento explica cómo ejecutar el sistema distribuido completo sin necesidad de instalar Java/Maven ni crear entornos virtuales de Python. Todo se orquesta mediante Docker y Docker Compose (ubicado dentro de la carpeta `infra/`), y el cliente se ejecuta con Node.js.

---

## Requisitos previos

1. **Docker**

   * Versión recomendada: Docker Engine ≥ 20.10
2. **Docker Compose**

   * Versión recomendada: Docker Compose ≥ 1.29
3. **Node.js y npm** (para el cliente CLI)

   * Node.js ≥ 18.x
   * npm ≥ 8.x

No es necesario tener instalado Java ni Python en la máquina anfitriona, ya que ambos servicios (“servicio-dni” y “servicio-ventas”) correrán dentro de contenedores Docker.

---

## Estructura de carpetas

```plaintext
sistema-distribuido/
├── cliente/                      ← Código del cliente Node.js (CLI)
│   ├── helpers/
│   │   ├── prompt.js
│   │   └── validator.js
│   ├── load_test/
│   │   └── generar_1000.js
│   ├── node_modules/
│   ├── .env
│   ├── Dockerfile                ← (opcional, si quisieras contenerizar el cliente)
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
│
├── infra/                        ← Aquí está todo lo relacionado con Docker Compose
│   ├── rabbitmq/
│   │   └── rabbitmq.conf
│   ├── servicio-ventas/
│   │   ├── scripts/
│   │   │   └── init_db.sql        ← Script de creación de tablas en PostgreSQL
│   │   ├── src/
│   │   │   └── main/java/com/ventas/
│   │   │       ├── config/
│   │   │       │   ├── JacksonConfig.java
│   │   │       │   └── RabbitConfig.java
│   │   │       ├── messaging/
│   │   │       │   └── RegistroListener.java
│   │   │       ├── model/
│   │   │       │   └── Cliente.java
│   │   │       ├── repository/
│   │   │       │   └── ClienteRepository.java
│   │   │       └── service/
│   │   │           ├── ClienteService.java
│   │   │           └── VentasApplication.java
│   │   └── src/main/resources/
│   │       └── application.properties
│   │   ├── Dockerfile
│   │   └── pom.xml
│   │
│   ├── servicio-dni/
│   │   ├── config/
│   │   │   └── config.yaml         ← Parámetros de conexión a MySQL y RabbitMQ
│   │   ├── scripts/
│   │   │   └── init_db.sql         ← Script de creación de tabla padron_dni en MySQL
│   │   ├── src/
│   │   │   ├── __init__.py
│   │   │   ├── dni_consumer.py
│   │   │   ├── dni_service.py
│   │   │   └── schemas.py
│   │   ├── app.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── docker-compose.yml         ← Archivo principal para orquestar todos los contenedores
│
├── .gitignore
└── README.md                     ← Este archivo
```

* **cliente/**
  Código JavaScript (Node.js) que se ejecuta en la máquina local sin Docker.
* **infra/**
  Carpeta donde se encuentra el `docker-compose.yml` y las carpetas con los Dockerfiles y scripts para los servicios “servicio-ventas” y “servicio-dni”, además de la configuración de RabbitMQ.
* **servicio-ventas/**
  Servicio Java 17 + Spring Boot que se conecta a PostgreSQL.
* **servicio-dni/**
  Servicio Python 3.11 + FastAPI que se conecta a MySQL.

---

## 1. Clonar el repositorio

```bash
git clone https://ruta-a-tu-repositorio/sistema-distribuido.git
cd sistema-distribuido
```

---

## 2. Construir y levantar todos los servicios con Docker Compose

1. Entrar en la carpeta **infra** (donde está ubicado `docker-compose.yml`):

   ```bash
   cd infra
   ```

2. Ejecutar el comando `docker-compose up` con la opción de reconstruir imágenes y en modo “detached” (en segundo plano):

   ```bash
   docker-compose up --build -d
   ```

   Este comando realizará lo siguiente:

   * **RabbitMQ**
     Levanta un contenedor RabbitMQ con el plugin de management, configurado mediante `infra/rabbitmq/rabbitmq.conf`.
   * **bd-mysql**
     Levanta un contenedor MySQL para el servicio “servicio-dni”, ejecutando `infra/servicio-dni/scripts/init_db.sql` para crear la tabla `padron_dni`.
   * **bd-postgres**
     Levanta un contenedor PostgreSQL para el servicio “servicio-ventas”, ejecutando `infra/servicio-ventas/scripts/init_db.sql` para crear las tablas `clientes` y `amigos`.
   * **servicio-dni**
     Construye e inicia el contenedor Python 3.11 + FastAPI, que se conecta a MySQL y RabbitMQ.
   * **servicio-ventas**
     Construye e inicia el contenedor Java 17 + Spring Boot, que se conecta a PostgreSQL y RabbitMQ.

3. Verificar que todos los contenedores estén “Up” y saludables (por ejemplo, MySQL suele definir un `healthcheck` para reportar “healthy”):

   ```bash
   docker ps
   ```

   Deberías ver contenedores con nombres similares a:

   ```
   sd-rabbitmq    (RabbitMQ, puertos 5672 y 15672)
   sd-mysql       (MySQL para servicio-dni, puerto 3306 expuesto en 3307)
   sd-postgres    (PostgreSQL para servicio-ventas, puerto 5432)
   sd-dni         (FastAPI, puerto 8000)
   sd-ventas      (Spring Boot, puerto 8001)
   ```

---

## 3. Verificar los endpoints de salud

### 3.1 Servicio DNI (FastAPI)

Abrir una terminal nueva y ejecutar:

```bash
curl http://localhost:8000/health
```

* **Respuesta esperada**:

  ```json
  {"status":"UP"}
  ```

### 3.2 Servicio Ventas (Spring Boot + Actuator)

Abrir otra terminal y ejecutar:

```bash
curl http://localhost:8001/actuator/health
```

* **Respuesta esperada** (ejemplo):

  ```json
  {
    "status":"UP",
    "components":{
      "db":{"status":"UP","details":{"database":"PostgreSQL","validationQuery":"isValid()"}},
      "diskSpace":{"status":"UP","details":{"total":...,"free":...,"threshold":...,"exists":true}},
      "ping":{"status":"UP"},
      "rabbit":{"status":"UP","details":{"version":"3.x.x"}}
    }
  }
  ```

Si alguno de estos endpoints no devuelve `status: "UP"`, revisar los logs correspondientes:

```bash
docker-compose logs -f servicio-dni
docker-compose logs -f servicio-ventas
```

---

## 4. Ejecutar el Cliente CLI (Node.js)

El cliente se ejecuta de forma local (sin Docker). Abrir una terminal nueva (fuera de la carpeta `infra/`) y dirigirse a:

```bash
cd cliente
npm install
npm run start
```

Al ejecutar `npm run start`, el CLI pedirá los campos del nuevo registro uno por uno:

```
? Nombre:
? Correo:
? Clave (secuencia de caracteres):
? DNI (8 dígitos numéricos):
? Teléfono:
? DNI de amigos (separados por coma):
```

1. **Completar** cada campo con los valores deseados.
2. Una vez ingresados, el CLI mostrará el JSON generado y esperará respuesta:

   ```
   ▶
     {"nombre":"Pedro","correo":"pedro@example.com","clave":"secreto123","dni":"12345678","telefono":"999888777","amigos":["23456789","34567890"]}

   ⌛ Esperando respuesta en las colas de confirmación/rechazo...
   ```

### 4.1 Flujo completo de mensajes

1. El cliente publica el JSON en la cola `registro.nuevo` de RabbitMQ.

2. **servicio-dni** (FastAPI) consume de `registro.nuevo`, valida los DNIs en MySQL (`padron_dni`) y:

   * Si falla alguna validación, publica en `registro.rechazado` un objeto con:

     ```json
     {
       "dni":"12345678",
       "error":"DNI principal '12345678' no encontrado en BD2."
     }
     ```
   * Si pasa la validación, reenvía el mismo JSON a la cola `registro.validado`.

3. **servicio-ventas** (Spring Boot) consume de `registro.validado`, inserta los datos en PostgreSQL (`clientes` y `amigos`) y publica un acuse en `registro.guardado`. Ejemplo de acuse:

   ```json
   {
     "id": 42,
     "nombre": "Pedro",
     "correo": "pedro@example.com",
     "clave": "secreto123",
     "dni": "12345678",
     "telefono": "999888777",
     "amigos": ["23456789","34567890"]
   }
   ```

4. El cliente está suscrito a las colas `registro.guardado` y `registro.rechazado`. Cuando reciba un mensaje, lo mostrará en pantalla:

   * **Éxito** (`registro.guardado`):

     ```
     ✅ Registro guardado:
     {
       "id": 42,
       "nombre":"Pedro",
       "correo":"pedro@example.com",
       "clave":"secreto123",
       "dni":"12345678",
       "telefono":"999888777",
       "amigos":["23456789","34567890"]
     }
     ```
   * **Error** (`registro.rechazado`):

     ```
     ❌ Registro rechazado:
     {
       "dni":"12345678",
       "error":"DNI principal '12345678' no encontrado en BD2."
     }
     ```

Para **salir** del cliente CLI, presionar `Ctrl+C`.

---

## 5. Carga de prueba: Generar 1000 registros aleatorios

Dentro de la carpeta `cliente/load_test/` existe un script `generar_1000.js` que envía 1000 registros simultáneos a la cola `registro.nuevo`. Antes de usarlo, asegúrate de que los DNIs aleatorios generados existan en la base `padron_dni` en MySQL.

1. Entrar a la carpeta del cliente:

   ```bash
   cd cliente
   npm install
   ```

2. Editar (opcional) el archivo `load_test/generar_1000.js` para ajustar el rango de DNIs válidos o la tasa de envío.

3. Ejecutar:

   ```bash
   npm run loadtest
   ```

   El script enviará 1000 mensajes a RabbitMQ y mostrará métricas de latencia y throughput al finalizar.

---

## 6. Verificar datos en las bases de datos (opcional)

### 6.1 MySQL (`servicio-dni`)

Para acceder al contenedor MySQL:

```bash
docker exec -it sd-mysql mysql -uroot -psecret
```

Dentro del prompt de MySQL:

```sql
USE dni_db;
SELECT COUNT(*) FROM padron_dni;
SELECT * FROM padron_dni LIMIT 5;
```

### 6.2 PostgreSQL (`servicio-ventas`)

Para acceder al contenedor PostgreSQL:

```bash
docker exec -it sd-postgres psql -U postgres
```

Dentro del prompt de `psql`:

```sql
\l
\c ventas_db
\dt
SELECT * FROM clientes LIMIT 5;
SELECT * FROM amigos LIMIT 5;
```

---

## 7. Consultar logs y detener todo

* Ver logs de **servicio-dni**:

  ```bash
  docker-compose logs -f servicio-dni
  ```
* Ver logs de **servicio-ventas**:

  ```bash
  docker-compose logs -f servicio-ventas
  ```
* Ver logs de **RabbitMQ**:

  ```bash
  docker-compose logs -f rabbitmq
  ```
* Para **detener y eliminar** los contenedores, redes y volúmenes creados:

  ```bash
  docker-compose down
  ```

