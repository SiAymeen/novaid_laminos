package com.novaid.services;

import com.novaid.repositories.UserRepository;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SmsService {

    private final UserRepository userRepository;

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.from-number}")
    private String fromNumber;

    public SmsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
    }

    public void sendToAllUsers(String messageBody) {
        userRepository.findByEnabledTrue().stream()
            .filter(u -> u.getPhone() != null && !u.getPhone().isBlank())
            .forEach(u -> {
                try {
                    Message.creator(
                        new PhoneNumber(u.getPhone()),
                        new PhoneNumber(fromNumber),
                        messageBody
                    ).create();
                } catch (Exception e) {
                    System.err.println("SMS failed for " + u.getPhone() + ": " + e.getMessage());
                }
            });
    }
}
