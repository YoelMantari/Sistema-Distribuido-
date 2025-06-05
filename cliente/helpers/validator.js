// cliente/helpers/validator.js

function esDniValido(dni) {
  return /^\d{8}$/.test(dni);
}

function esCorreoBasicoValido(correo) {
  // Validación mínima: “algo@algo.algo”
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

/**
 * Recibe el objeto { nombre, correo, clave, dni, telefono, amigos: [] }
 * Devuelve un array de mensajes de error. Si está vacío, todo OK.
 */
export function validarCampos(data) {
  const errores = [];

  if (!data.nombre || data.nombre.trim().length === 0) {
    errores.push('El nombre no puede estar vacío.');
  }

  if (!esCorreoBasicoValido(data.correo)) {
    errores.push(`Correo '${data.correo}' no tiene un formato válido.`);
  }

  if (!data.clave || data.clave.length < 4) {
    errores.push('La clave debe tener al menos 4 caracteres.');
  }

  if (!esDniValido(data.dni)) {
    errores.push(`DNI '${data.dni}' inválido (debe tener 8 dígitos numéricos).`);
  }

  if (!data.telefono || data.telefono.trim().length === 0) {
    errores.push('El teléfono no puede estar vacío.');
  }

  for (const amigo of data.amigos) {
    if (!esDniValido(amigo)) {
      errores.push(`DNI de amigo '${amigo}' inválido (debe tener 8 dígitos).`);
    }
  }

  return errores;
}
