// cliente/load_test/generar_1000.js

import 'dotenv/config';
import amqp from 'amqplib';
import { faker } from '@faker-js/faker';

async function generarYEnviar(n = 1000) {
  const url = process.env.RABBITMQ_URL;
  const queueNuevo = process.env.COLA_REG_NUEVO;

  let connection, channel;
  try {
    connection = await amqp.connect(url);
    channel = await connection.createChannel();
    await channel.assertQueue(queueNuevo, { durable: true });

    console.log(`Iniciando envío de ${n} mensajes a '${queueNuevo}'…`);

    for (let i = 1; i <= n; i++) {
      // Generar un DNI aleatorio de 8 dígitos
      const dniAleatorio = faker.string.numeric(8);

      // Generar entre 0 y 3 amigos (DNI aleatorios de 8 dígitos)
      const numAmigos = faker.number.int({ min: 0, max: 3 });
      const amigos = [];
      for (let j = 0; j < numAmigos; j++) {
        amigos.push(faker.string.numeric(8));
      }

      const mensaje = {
        nombre: faker.person.firstName(),
        correo: faker.internet.email(),
        clave: faker.internet.password({ length: 8 }),
        dni: dniAleatorio,
        telefono: faker.phone.number('##########'),
        amigos: amigos
      };

      channel.sendToQueue(queueNuevo, Buffer.from(JSON.stringify(mensaje)), {
        persistent: true
      });

      if (i % 100 === 0) {
        console.log(`  ➜ ${i}/${n} mensajes enviados`);
      }
    }

    console.log(`✅ Se enviaron ${n} mensajes a la cola '${queueNuevo}'.`);
    await channel.close();
    await connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error en load test:', err);
    process.exit(1);
  }
}

generarYEnviar().catch(console.error);
