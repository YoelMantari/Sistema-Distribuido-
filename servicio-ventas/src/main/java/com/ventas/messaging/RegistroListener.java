package com.ventas.messaging;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ventas.service.ClienteService;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class RegistroListener {

    private final ClienteService clienteService;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    // Inyectamos desde application.properties
    @Value("${app.rabbitmq.exchange}")
    private String exchange;

    @Value("${app.rabbitmq.routing.guardado}")
    private String routingGuardado;

    @Value("${app.rabbitmq.routing.rechazado}")
    private String routingRechazado;

    @Autowired
    public RegistroListener(ClienteService clienteService,
                            RabbitTemplate rabbitTemplate,
                            ObjectMapper objectMapper) {
        this.clienteService = clienteService;
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Este método escucha mensajes que ya fueron validados por el servicio-DNI.
     * Se asume que llegan a la cola 'registro.validado'.
     */
    @RabbitListener(queues = "${app.rabbitmq.cola.validada}")
    public void recibirYGuardar(Message message) {
        try {
            // Convertir el cuerpo del mensaje (byte[]) en String usando UTF-8
            String body = new String(message.getBody(), StandardCharsets.UTF_8);
            JsonNode jsonDatos = objectMapper.readTree(body);

            // Llamar al servicio para insertar en PostgreSQL
            clienteService.procesarYGuardar(jsonDatos);

            // Publicar en la cola de "guardado"
            rabbitTemplate.convertAndSend(
                    exchange,
                    routingGuardado,
                    message.getBody()
            );
        } catch (Exception e) {
            // Si hay error en guardado, se publica en cola de rechazados para notificar al cliente
            try {
                String errorMsg = String.format("{\"error\":\"%s\"}", e.getMessage());
                rabbitTemplate.convertAndSend(
                        exchange,
                        routingRechazado,
                        errorMsg.getBytes(StandardCharsets.UTF_8)
                );
            } catch (Exception ex2) {
                ex2.printStackTrace();
            }
        }
        // Con @RabbitListener y acknowledge-mode=auto, el ACK se envía automáticamente al final.
    }
}
