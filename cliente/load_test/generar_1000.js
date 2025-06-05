// cliente/load_test/generar_1000.js

import 'dotenv/config';
import amqp from 'amqplib';
import { faker } from '@faker-js/faker';

const dnisValidos = [
  "59615157", "34679595", "80186415", "89986000", "95813885",
  "90988397", "42399777", "39367389", "39040157", "34531197",
  "69774354", "72444519", "30126508", "24819081", "39083847",
  "39026739", "39648353", "39048392", "39048697", "39046909"
];

async function generarYEnviar(n = 300) {
  const url = process.env.RABBITMQ_URL;
  const queueNuevo = process.env.COLA_REG_NUEVO;

  let connection, channel;
  try {
    connection = await amqp.connect(url);
    channel = await connection.createChannel();
    await channel.assertQueue(queueNuevo, { durable: true });

    console.log(`Iniciando envío de ${n} mensajes a '${queueNuevo}'…`);

    for (let i = 0; i < n; i++) {
      // Usar uno de los 20 DNIs válidos para los primeros 20 registros
      const dniAleatorio = i < 20
        ? dnisValidos[i]
        : faker.string.numeric(8);  // El resto se generan aleatoriamente

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

      if ((i + 1) % 100 === 0) {
        console.log(`  ➜ ${i + 1}/${n} mensajes enviados`);
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

