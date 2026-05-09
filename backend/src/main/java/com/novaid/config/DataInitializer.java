package com.novaid.config;

import com.novaid.models.User;
import com.novaid.models.UserRole;
import com.novaid.models.Visit;
import com.novaid.models.VisitStatus;
import com.novaid.repositories.FamilyRepository;
import com.novaid.repositories.UserRepository;
import com.novaid.repositories.VisitRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

// Runs after data.sql to seed users and visits with proper BCrypt-hashed passwords.
@Component
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final VisitRepository visitRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           FamilyRepository familyRepository,
                           VisitRepository visitRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.familyRepository = familyRepository;
        this.visitRepository = visitRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.findAll().isEmpty()) return;

        User admin = createUser("Admin Novaid", "admin@novaid.tn", "admin123", UserRole.ADMIN, "20000000");
        User agent = createUser("Aymen Dridi", "aymen@novaid.tn", "agent123", UserRole.AGENT, "21111111");
        createUser("Yosser Kallel", "yosser@novaid.tn", "coord123", UserRole.COORDINATOR, "22222222");

        List<com.novaid.models.Family> families = familyRepository.findAll().stream().limit(3).toList();

        // PLANNED visits (for testing nearby/far missions + check-in)
        families.forEach(family -> {
            Visit visit = new Visit();
            visit.setFamily(family);
            visit.setVolunteer(agent);
            visit.setVisitDate(LocalDateTime.now().plusDays(1));
            visit.setStatus(VisitStatus.PLANNED);
            visit.setNotes("Visite planifiée");
            visitRepository.save(visit);
        });

        // COMPLETED visits (for history section)
        families.forEach(family -> {
            Visit visit = new Visit();
            visit.setFamily(family);
            visit.setVolunteer(agent);
            visit.setVisitDate(LocalDateTime.now().minusDays(1));
            visit.setStatus(VisitStatus.COMPLETED);
            visit.setNotes("Visite de suivi");
            visitRepository.save(visit);
        });
    }

    private User createUser(String fullName, String email, String rawPassword, UserRole role, String phone) {
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setPhone(phone);
        user.setEnabled(true);
        return userRepository.save(user);
    }
}
