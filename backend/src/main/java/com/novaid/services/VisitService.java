package com.novaid.services;

import com.novaid.dto.VisitRequest;
import com.novaid.dto.VisitResponse;
import com.novaid.models.Family;
import com.novaid.models.GpsCoordinates;
import com.novaid.models.User;
import com.novaid.models.Visit;
import com.novaid.models.VisitStatus;
import com.novaid.repositories.FamilyRepository;
import com.novaid.repositories.UserRepository;
import com.novaid.repositories.VisitRepository;
import com.novaid.utils.GeoUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VisitService {

    private final VisitRepository visitRepository;
    private final FamilyRepository familyRepository;
    private final UserRepository userRepository;

    public VisitService(VisitRepository visitRepository,
                        FamilyRepository familyRepository,
                        UserRepository userRepository) {
        this.visitRepository = visitRepository;
        this.familyRepository = familyRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<VisitResponse> getAll() {
        return visitRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VisitResponse> getByFamily(Long familyId) {
        return visitRepository.findByFamilyId(familyId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VisitResponse> getByVolunteer(Long volunteerId) {
        return visitRepository.findByVolunteerId(volunteerId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VisitResponse getById(Long id) {
        return toResponse(findVisit(id));
    }

    public VisitResponse create(VisitRequest request) {
        Visit visit = new Visit();
        applyRequest(visit, request);
        return toResponse(visitRepository.save(visit));
    }

    public VisitResponse update(Long id, VisitRequest request) {
        Visit visit = findVisit(id);
        applyRequest(visit, request);
        return toResponse(visitRepository.save(visit));
    }

    public void delete(Long id) {
        visitRepository.delete(findVisit(id));
    }

    // Validates agent location against family GPS — marks visit COMPLETED if within 500m
    public VisitResponse checkInLocation(Long visitId, double agentLat, double agentLng) {
        Visit visit = findVisit(visitId);
        GpsCoordinates familyGps = visit.getFamily().getGps();

        if (familyGps == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Family has no GPS coordinates registered");
        }

        double distance = GeoUtils.distanceMeters(agentLat, agentLng,
            familyGps.getLatitude(), familyGps.getLongitude());

        if (distance > 500.0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                String.format("Agent is %.0f m away — must be within 500 m of the family", distance));
        }

        visit.setCheckInLat(agentLat);
        visit.setCheckInLng(agentLng);
        visit.setCheckInTime(LocalDateTime.now());
        visit.setStatus(VisitStatus.COMPLETED);
        return toResponse(visitRepository.save(visit));
    }

    private Visit findVisit(Long id) {
        return visitRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Visit not found"));
    }

    private void applyRequest(Visit visit, VisitRequest request) {
        Family family = familyRepository.findById(request.getFamilyId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Family not found"));
        User volunteer = userRepository.findById(request.getVolunteerId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Volunteer not found"));
        visit.setFamily(family);
        visit.setVolunteer(volunteer);
        visit.setVisitDate(request.getVisitDate());
        visit.setStatus(request.getStatus() == null ? VisitStatus.PLANNED : request.getStatus());
        visit.setNotes(request.getNotes());
        visit.setCheckInLat(request.getCheckInLat());
        visit.setCheckInLng(request.getCheckInLng());
        visit.setCheckInTime(request.getCheckInTime());
        visit.setProofPhotoPath(request.getProofPhotoPath());
    }

    public VisitResponse toResponse(Visit visit) {
        VisitResponse response = new VisitResponse();
        response.setId(visit.getId());
        response.setVisitDate(visit.getVisitDate());
        response.setStatus(visit.getStatus());
        response.setNotes(visit.getNotes());
        response.setCheckInLat(visit.getCheckInLat());
        response.setCheckInLng(visit.getCheckInLng());
        response.setCheckInTime(visit.getCheckInTime());
        response.setProofPhotoPath(visit.getProofPhotoPath());

        Family family = visit.getFamily();
        if (family != null) {
            response.setFamilyId(family.getId());
            response.setFamilyName(family.getHeadName());
            response.setFamilyAddress(family.getAddress());
            response.setNeeds(family.getNeeds());
            if (family.getGps() != null) {
                response.setFamilyLatitude(family.getGps().getLatitude());
                response.setFamilyLongitude(family.getGps().getLongitude());
            }
        }

        User volunteer = visit.getVolunteer();
        if (volunteer != null) {
            response.setVolunteerId(volunteer.getId());
        }

        return response;
    }
}
