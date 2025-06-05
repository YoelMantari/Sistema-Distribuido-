package com.ventas.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    // Esto le dice a Spring AMQP que declare—si no existe—la cola "registro.validado"
    @Bean
    public Queue registroValidadoQueue() {
        return new Queue("registro.validado", true);
    }
}
