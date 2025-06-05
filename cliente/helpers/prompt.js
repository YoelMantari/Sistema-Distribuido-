// cliente/helpers/prompt.js

import inquirer from 'inquirer';

export async function pedirDatosUsuario() {
  const preguntas = [
    {
      type: 'input',
      name: 'nombre',
      message: 'Nombre:',
      validate: (input) => input.trim() !== '' || 'El nombre no puede estar vacío.'
    },
    {
      type: 'input',
      name: 'correo',
      message: 'Correo:',
      validate: (input) => input.trim() !== '' || 'El correo no puede estar vacío.'
    },
    {
      type: 'password',
      name: 'clave',
      message: 'Clave (secuencia de caracteres):',
      mask: '*',
      validate: (input) => input.trim().length >= 4 || 'La clave debe tener al menos 4 caracteres.'
    },
    {
      type: 'input',
      name: 'dni',
      message: 'DNI (8 dígitos numéricos):',
      validate: (input) => /^\d{8}$/.test(input) || 'El DNI debe tener exactamente 8 dígitos numéricos.'
    },
    {
      type: 'input',
      name: 'telefono',
      message: 'Teléfono:',
      validate: (input) => input.trim() !== '' || 'El teléfono no puede estar vacío.'
    },
    {
      type: 'input',
      name: 'amigos',
      message: 'DNI de amigos (separados por coma):',
      default: '',
      filter: (input) => input.trim()
    }
  ];

  const respuestas = await inquirer.prompt(preguntas);

  // Convertir cadena "12345678,87654321" en array ["12345678", "87654321"]
  const listaAmigos = respuestas.amigos
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return {
    nombre: respuestas.nombre.trim(),
    correo: respuestas.correo.trim(),
    clave: respuestas.clave.trim(),
    dni: respuestas.dni.trim(),
    telefono: respuestas.telefono.trim(),
    amigos: listaAmigos
  };
}
