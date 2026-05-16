package com.novaid.services;

import com.novaid.repositories.UserRepository;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.springframework.stereotype.Service;

@Service
public class WhatsAppService {

    private static final String SANDBOX_NUMBER = "whatsapp:+14155238886";

    private final UserRepository userRepository;

    public WhatsAppService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void sendToAllUsers(String messageBody) {
        userRepository.findByEnabledTrue().stream()
            .filter(u -> u.getPhone() != null && !u.getPhone().isBlank())
            .forEach(u -> {
                try {
                    Message.creator(
                        new PhoneNumber("whatsapp:" + u.getPhone()),
                        new PhoneNumber(SANDBOX_NUMBER),
                        messageBody
                    ).create();
                } catch (Exception e) {
                    System.err.println("WhatsApp failed for " + u.getPhone() + ": " + e.getMessage());
                }
            });
    }
}
