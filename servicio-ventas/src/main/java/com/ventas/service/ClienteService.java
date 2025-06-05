package com.ventas.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ventas.model.Cliente;
import com.ventas.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Inserta un nuevo cliente en BD1, junto a sus relaciones de amistad.
     * @param jsonDatos: JsonNode con la estructura
     *                   {
     *                     "nombre":"fulano",
     *                     "correo":"fulano@memail.com",
     *                     "clave":"1234",
     *                     "dni":"20453629",
     *                     "telefono":"89674539",
     *                     "amigos":[id1,id2,...]
     *                   }
     */
    @Transactional
    public void procesarYGuardar(JsonNode jsonDatos) throws Exception {
        // 1. Crear objeto Cliente principal
        Cliente cliente = new Cliente();
        cliente.setNombre(jsonDatos.get("nombre").asText());
        cliente.setCorreo(jsonDatos.get("correo").asText());
        cliente.setClave(jsonDatos.get("clave").asText());
        cliente.setDni(jsonDatos.get("dni").asText());
        cliente.setTelefono(jsonDatos.get("telefono").asText());

        // 2. Guardar primero sin amigos para que genere ID
        Cliente saved = clienteRepository.save(cliente);

        // 3. Procesar lista de amigos (IDs) y asociarlos
        Set<Cliente> setAmigos = new HashSet<>();
        JsonNode listaAmigos = jsonDatos.get("amigos");
        if (listaAmigos != null && listaAmigos.isArray()) {
            Iterator<JsonNode> iter = listaAmigos.elements();
            while (iter.hasNext()) {
                Long amigoId = iter.next().asLong();
                clienteRepository.findById(amigoId).ifPresent(setAmigos::add);
                // Si el amigo no existe, se omite (se asume que el servicio-DNI ya validó existencia en BD2
                // y quizás BD1 ya tenga copias de los amigos en anteriores registros).
            }
        }
        // 4. Asignar amigos y volver a guardar
        saved.setAmigos(setAmigos);
        clienteRepository.save(saved);
    }
}
