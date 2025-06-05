import pika
import json
import os
import time
from src.schemas import Registro
from src.dni_service import validar_usuario

def start_consumidor():
    """
    Conecta a RabbitMQ y consume mensajes de 'registro.nuevo'. Por cada mensaje:
      - Valida en BD2 (MySQL) usando validar_usuario().
      - Si OK → publica en 'registro.validado' el mismo JSON.
      - Si fallo → publica en 'registro.rechazado' un JSON con el detalle del error.
    """

    # 1) Obtener RabbitMQ host/port de variables de entorno (Compose los inyecta).
    #    Si no existen, caemos a valores por defecto: localhost:5672
    rabbit_host = os.getenv("RABBITMQ_HOST", "localhost")
    rabbit_port = int(os.getenv("RABBITMQ_PORT", "5672"))
    rabbit_exchange = os.getenv("RABBITMQ_EXCHANGE", "my_exchange")
    queue_nuevo     = os.getenv("RABBITMQ_COLA_NUEVO", "registro.nuevo")
    queue_validado  = os.getenv("RABBITMQ_COLA_VALIDADO", "registro.validado")
    queue_rechazado = os.getenv("RABBITMQ_COLA_RECHAZADO", "registro.rechazado")

    # 2) Intentar conectar a RabbitMQ con reintentos
    parameters = pika.ConnectionParameters(host=rabbit_host, port=rabbit_port)
    max_retries = 10
    sleep_between = 3  # segundos entre reintentos
    attempt = 0

    while attempt < max_retries:
        try:
            connection = pika.BlockingConnection(parameters)
            channel = connection.channel()
            break
        except pika.exceptions.AMQPConnectionError:
            attempt += 1
            print(f"[servicio-dni] RabbitMQ aún no disponible, reintentando ({attempt}/{max_retries}) en {rabbit_host}:{rabbit_port}...")
            time.sleep(sleep_between)
    else:
        raise RuntimeError(f"No se pudo conectar a RabbitMQ en {rabbit_host}:{rabbit_port} tras {max_retries} intentos.")

    # 3) Declarar exchange y colas (durables)
    channel.exchange_declare(exchange=rabbit_exchange, exchange_type="direct", durable=True)
    channel.queue_declare(queue=queue_nuevo, durable=True)
    channel.queue_declare(queue=queue_validado, durable=True)
    channel.queue_declare(queue=queue_rechazado, durable=True)

    # 4) Vincular colas al exchange (routing key igual al nombre de la cola)
    channel.queue_bind(exchange=rabbit_exchange, queue=queue_nuevo, routing_key=queue_nuevo)
    channel.queue_bind(exchange=rabbit_exchange, queue=queue_validado, routing_key=queue_validado)
    channel.queue_bind(exchange=rabbit_exchange, queue=queue_rechazado, routing_key=queue_rechazado)

    print(f"[servicio-dni] ▶️ Conectado a RabbitMQ en {rabbit_host}:{rabbit_port}. Esperando mensajes en '{queue_nuevo}'...")

    # 5) Función callback para procesar cada mensaje entrante
    def callback(ch, method, properties, body):
        try:
            mensaje_str = body.decode("utf-8")
            data_json = json.loads(mensaje_str)
            # Validar con Pydantic primero
            registro = Registro(**data_json)

            # Validar en BD2
            valido, detalle = validar_usuario(data_json)
            if valido:
                # Publicar el mismo JSON en 'registro.validado'
                channel.basic_publish(
                    exchange=rabbit_exchange,
                    routing_key=queue_validado,
                    body=json.dumps(data_json),
                    properties=pika.BasicProperties(delivery_mode=2)  # mensaje durable
                )
                print(f"[servicio-dni] ✅ Usuario y amigos OK → enviado a '{queue_validado}': {registro.dni}")
            else:
                # Publicar un objeto de error en 'registro.rechazado'
                error_obj = {
                    "dni": registro.dni,
                    "error": detalle
                }
                channel.basic_publish(
                    exchange=rabbit_exchange,
                    routing_key=queue_rechazado,
                    body=json.dumps(error_obj),
                    properties=pika.BasicProperties(delivery_mode=2)
                )
                print(f"[servicio-dni] ❌ Validación falló → enviado a '{queue_rechazado}': {error_obj}")
        except Exception as e:
            # En caso de excepción imprevista, informar al cliente
            error_obj = {"error": f"Excepción interna: {str(e)}"}
            channel.basic_publish(
                exchange=rabbit_exchange,
                routing_key=queue_rechazado,
                body=json.dumps(error_obj),
                properties=pika.BasicProperties(delivery_mode=2)
            )
            print(f"[servicio-dni] ⚠️ Excepción procesando mensaje: {e}")
        finally:
            # Acknowledge manual
            ch.basic_ack(delivery_tag=method.delivery_tag)

    # 6) Configurar QoS para procesar 1 mensaje a la vez (evitar overload)
    channel.basic_qos(prefetch_count=1)

    # 7) Iniciar consumo
    channel.basic_consume(queue=queue_nuevo, on_message_callback=callback)
    channel.start_consuming()


if __name__ == "__main__":
    start_consumidor()
