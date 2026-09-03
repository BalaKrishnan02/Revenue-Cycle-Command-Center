package com.xirotech.rcm.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class LiveUpdateService {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public LiveUpdateService(@Autowired(required = false) SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastUpdate(String eventType, Object payload) {
        try {
            if (messagingTemplate != null) {
                Map<String, Object> message = new HashMap<>();
                message.put("eventType", eventType);
                message.put("payload", payload);
                message.put("timestamp", System.currentTimeMillis());

                messagingTemplate.convertAndSend("/topic/updates", message);
                log.info("Broadcasted live update via WebSocket: {}", eventType);
            } else {
                log.info("Live update event generated (fallback polling enabled): {}", eventType);
            }
        } catch (Exception e) {
            log.warn("Could not broadcast live update via WebSocket: {}", e.getMessage());
        }
    }
}
