package com.novaid.controllers;

import com.novaid.dto.CheckInRequest;
import com.novaid.dto.VisitRequest;
import com.novaid.dto.VisitResponse;
import com.novaid.services.VisitService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visits")
public class VisitController {

    private final VisitService visitService;

    public VisitController(VisitService visitService) {
        this.visitService = visitService;
    }

    @GetMapping
    public List<VisitResponse> getAllVisits() {
        return visitService.getAll();
    }

    @GetMapping("/{id}")
    public VisitResponse getVisitById(@PathVariable Long id) {
        return visitService.getById(id);
    }

    @GetMapping("/family/{familyId}")
    public List<VisitResponse> getByFamily(@PathVariable Long familyId) {
        return visitService.getByFamily(familyId);
    }

    @GetMapping("/volunteer/{volunteerId}")
    public List<VisitResponse> getByVolunteer(@PathVariable Long volunteerId) {
        return visitService.getByVolunteer(volunteerId);
    }

    @PostMapping
    public ResponseEntity<VisitResponse> createVisit(@Valid @RequestBody VisitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(visitService.create(request));
    }

    @PutMapping("/{id}")
    public VisitResponse updateVisit(@PathVariable Long id, @Valid @RequestBody VisitRequest request) {
        return visitService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVisit(@PathVariable Long id) {
        visitService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Agent sends their GPS coordinates — validated against family location (500m radius)
    @PostMapping("/{id}/checkin")
    public VisitResponse checkIn(@PathVariable Long id, @Valid @RequestBody CheckInRequest request) {
        return visitService.checkInLocation(id, request.getLatitude(), request.getLongitude());
    }
}
