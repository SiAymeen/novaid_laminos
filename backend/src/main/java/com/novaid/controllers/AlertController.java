package com.novaid.controllers;

import com.novaid.dto.*;
import com.novaid.models.*;
import com.novaid.repositories.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final FamilyRepository familyRepository;
    private final InventoryRepository inventoryRepository;
    private final VisitRepository visitRepository;

    public AlertController(FamilyRepository familyRepository, InventoryRepository inventoryRepository, VisitRepository visitRepository) {
        this.familyRepository = familyRepository;
        this.inventoryRepository = inventoryRepository;
        this.visitRepository = visitRepository;
    }

    @GetMapping
    public AlertsResponse getAlerts() {
        List<Family> activeFamilies = familyRepository.findByActiveTrue();
        List<Visit> allVisits = visitRepository.findAll();
        List<Item> allItems = inventoryRepository.findAll();

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        Map<Long, Visit> latestVisits = new HashMap<>();
        for (Visit v : allVisits) {
            if (v.getStatus() == VisitStatus.COMPLETED) {
                Long fId = v.getFamily().getId();
                Visit currentLatest = latestVisits.get(fId);
                if (currentLatest == null || v.getVisitDate().isAfter(currentLatest.getVisitDate())) {
                    latestVisits.put(fId, v);
                }
            }
        }

        List<FamilyAlertDto> urgentFamilies = new ArrayList<>();
        List<FamilyAlertDto> forgottenFamilies = new ArrayList<>();

        for (Family f : activeFamilies) {
            Visit latestVisit = latestVisits.get(f.getId());
            LocalDateTime lastVisitDate = latestVisit != null ? latestVisit.getVisitDate() : null;

            if (f.getUrgencyIndex() >= 7) {
                urgentFamilies.add(new FamilyAlertDto(f.getId(), f.getHeadName(), f.getAddress(), f.getNeeds(), "urgent", lastVisitDate));
            }

            if (lastVisitDate == null || lastVisitDate.isBefore(thirtyDaysAgo)) {
                forgottenFamilies.add(new FamilyAlertDto(f.getId(), f.getHeadName(), f.getAddress(), f.getNeeds(), "forgotten", lastVisitDate));
            }
        }

        List<ItemAlertDto> lowStockItems = allItems.stream()
                .filter(i -> i.getQuantity() <= i.getMinThreshold())
                .map(i -> new ItemAlertDto(i.getId(), i.getName(), i.getQuantity(), i.getMinThreshold(), i.getUnit()))
                .collect(Collectors.toList());

        List<ReportAlertDto> recentReports = allVisits.stream()
                .filter(v -> v.getStatus() == VisitStatus.COMPLETED && v.getVisitDate() != null && v.getVisitDate().isAfter(sevenDaysAgo))
                .sorted(Comparator.comparing(Visit::getVisitDate).reversed())
                .map(v -> new ReportAlertDto(v.getId(), v.getFamily().getHeadName(), v.getVolunteer().getFullName(), v.getVisitDate(), v.getNotes()))
                .collect(Collectors.toList());

        return new AlertsResponse(urgentFamilies, forgottenFamilies, lowStockItems, recentReports);
    }
}
