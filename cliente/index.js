// cliente/index.js

import 'dotenv/config';                  // Carga variables de .env automáticamente
import amqp from 'amqplib';
import { pedirDatosUsuario } from './helpers/prompt.js';
import { validarCampos } from './helpers/validator.js';

async function main() {
  // 1) Pedir datos al usuario vía CLI
  const data = await pedirDatosUsuario();

  // 2) Validar campos básicos
  const errores = validarCampos(data);
  if (errores.length > 0) {
    console.log('❌ Se encontraron errores de validación:');
    errores.forEach((e) => console.log('  - ' + e));
    process.exit(1);
  }

  const url = process.env.RABBITMQ_URL;
  const queueNuevo = process.env.COLA_REG_NUEVO;
  const queueGuardado = process.env.COLA_REG_GUARDADO;
  const queueRechazado = process.env.COLA_REG_RECHAZADO;

  let connection, channel;
  try {
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    // Asegurarnos de que las colas existan (durables)
    await channel.assertQueue(queueNuevo, { durable: true });
    await channel.assertQueue(queueGuardado, { durable: true });
    await channel.assertQueue(queueRechazado, { durable: true });

    // 3) Publicar el mensaje JSON en registro.nuevo
    const payload = JSON.stringify(data);
    channel.sendToQueue(queueNuevo, Buffer.from(payload), { persistent: true });
    console.log(`▶️ Mensaje enviado a '${queueNuevo}':\n  ${payload}`);

    // 4) Suscribirse a cola 'registro.guardado'
    channel.consume(
      queueGuardado,
      (msg) => {
        if (msg !== null) {
          const respuesta = JSON.parse(msg.content.toString());
          console.log('\n✅ Registro guardado con éxito:');
          console.log(JSON.stringify(respuesta, null, 2));
          channel.ack(msg);
        }
      },
      { noAck: false }
    );

    // 5) Suscribirse a cola 'registro.rechazado'
    channel.consume(
      queueRechazado,
      (msg) => {
        if (msg !== null) {
          const errorObj = JSON.parse(msg.content.toString());
          console.log('\n❌ Registro rechazado:');
          console.log(JSON.stringify(errorObj, null, 2));
          channel.ack(msg);
        }
      },
      { noAck: false }
    );

    console.log('\n⌛ Esperando respuesta en las colas de confirmación/rechazo...\n');
  } catch (err) {
    console.error('Error conectando a RabbitMQ:', err);
    process.exit(1);
  }

  // Nota: no cerramos la conexión para mantener vivo el consumidor.
}

main().catch((err) => {
  console.error('Error en cliente:', err);
  process.exit(1);
});
