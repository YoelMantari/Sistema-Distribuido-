import pymysql
import os
import time

# Primero, leemos de las variables de entorno (Compose ya las inyecta) o caemos a valores por defecto:
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "")

# Intentar conectar en un bucle, esperando a que MySQL esté listo
conn = None
max_intentos = 10
for intento in range(1, max_intentos + 1):
    try:
        conn = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        print(f"[servicio-dni] Conectado a MySQL en {MYSQL_HOST}:{MYSQL_PORT}")
        break
    except pymysql.err.OperationalError:
        print(f"[servicio-dni] MySQL aún no disponible, reintentando ({intento}/{max_intentos})...")
        time.sleep(2)

if conn is None:
    raise RuntimeError("No se pudo conectar a MySQL después de varios intentos")


def validar_usuario(data: dict) -> (bool, str):
    """
    Valida que el DNI principal y cada DNI de la lista 'amigos' existan en la tabla `padron_dni`.
    Devuelve (True, "") si todo está OK.
    Si falta el DNI principal o alguno de los amigos, devuelve (False, detalle_error).
    """
    with conn.cursor() as cursor:
        dni_principal = data.get("dni")

        # 1) Validar DNI principal
        sql = "SELECT COUNT(*) as count FROM padron_dni WHERE dni = %s"
        cursor.execute(sql, (dni_principal,))
        result = cursor.fetchone()
        if result["count"] == 0:
            return False, f"DNI principal '{dni_principal}' no encontrado en BD2."

        # 2) Validar cada DNI de 'amigos'
        lista_amigos = data.get("amigos", [])
        for amigo_dni in lista_amigos:
            cursor.execute(sql, (amigo_dni,))
            res_amigo = cursor.fetchone()
            if res_amigo["count"] == 0:
                return False, f"DNI de amigo '{amigo_dni}' no encontrado en BD2."

    # Si llegó hasta aquí, todos existen
    return True, ""
