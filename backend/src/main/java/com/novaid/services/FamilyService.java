package com.novaid.services;

import com.novaid.dto.FamilyRequest;
import com.novaid.dto.FamilyResponse;
import com.novaid.models.Family;
import com.novaid.models.GpsCoordinates;
import com.novaid.repositories.FamilyRepository;
import com.novaid.utils.GeoUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class FamilyService {

    private final FamilyRepository familyRepository;
    private final SmsService smsService;
    private final WhatsAppService whatsAppService;

    @Value("${novaid.app.centerLat}")
    private double centerLat;

    @Value("${novaid.app.centerLng}")
    private double centerLng;

    public FamilyService(FamilyRepository familyRepository, SmsService smsService, WhatsAppService whatsAppService) {
        this.familyRepository = familyRepository;
        this.smsService = smsService;
        this.whatsAppService = whatsAppService;
    }

    @Transactional(readOnly = true)
    public List<FamilyResponse> getAll() {
        return familyRepository.findByActiveTrue().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FamilyResponse getById(Long id) {
        return toResponse(findActiveFamily(id));
    }

    public FamilyResponse create(FamilyRequest request) {
        Family family = new Family();
        applyRequest(family, request);
        family.setActive(true);
        Family saved = familyRepository.save(family);
        if (saved.getUrgencyIndex() >= 7) {
            String msg = "NOVAID ALERTE: Nouvelle famille URGENTE ajoutee - " + saved.getHeadName() + ". Intervention requise.";
            smsService.sendToAllUsers(msg);
            whatsAppService.sendToAllUsers(msg);
        }
        return toResponse(saved);
    }

    public FamilyResponse update(Long id, FamilyRequest request) {
        Family family = findActiveFamily(id);
        boolean wasUrgent = family.getUrgencyIndex() >= 7;
        applyRequest(family, request);
        Family saved = familyRepository.save(family);
        if (!wasUrgent && saved.getUrgencyIndex() >= 7) {
            String msg = "NOVAID ALERTE: Famille " + saved.getHeadName() + " est maintenant URGENTE. Intervention requise.";
            smsService.sendToAllUsers(msg);
            whatsAppService.sendToAllUsers(msg);
        }
        return toResponse(saved);
    }

    public void delete(Long id) {
        Family family = findActiveFamily(id);
        family.setActive(false);
        familyRepository.save(family);
    }

    // Returns distance in meters from the family's GPS to the configured center coordinate
    @Transactional(readOnly = true)
    public Map<String, Object> getDistanceToCenter(Long id) {
        Family family = findActiveFamily(id);
        GpsCoordinates gps = family.getGps();
        if (gps == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Family has no GPS coordinates");
        }
        double distance = GeoUtils.distanceMeters(gps.getLatitude(), gps.getLongitude(), centerLat, centerLng);
        return Map.of(
            "familyId", id,
            "distanceMeters", Math.round(distance),
            "centerLat", centerLat,
            "centerLng", centerLng
        );
    }

    private Family findActiveFamily(Long id) {
        Family family = familyRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Family not found"));
        if (!family.isActive()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Family not found");
        }
        return family;
    }

    private void applyRequest(Family family, FamilyRequest request) {
        family.setHeadName(request.getHeadName());
        family.setAddress(request.getAddress());
        family.setUrgencyIndex(request.getUrgencyIndex());
        List<String> needs = request.getNeeds();
        family.setNeeds(needs == null ? new ArrayList<>() : new ArrayList<>(needs));
        if (request.getLatitude() != null && request.getLongitude() != null) {
            family.setGps(new GpsCoordinates(request.getLatitude(), request.getLongitude()));
        } else {
            family.setGps(null);
        }
    }

    public FamilyResponse toResponse(Family family) {
        FamilyResponse response = new FamilyResponse();
        response.setId(family.getId());
        response.setHeadName(family.getHeadName());
        response.setAddress(family.getAddress());
        response.setUrgencyIndex(family.getUrgencyIndex());
        response.setNeeds(family.getNeeds());
        if (family.getGps() != null) {
            response.setLatitude(family.getGps().getLatitude());
            response.setLongitude(family.getGps().getLongitude());
        }
        response.setActive(family.isActive());
        return response;
    }
}
