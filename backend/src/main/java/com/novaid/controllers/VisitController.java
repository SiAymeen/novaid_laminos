package com.novaid.controllers;

import com.novaid.dto.CheckInRequest;
import com.novaid.dto.VisitRequest;
import com.novaid.dto.VisitResponse;
import com.novaid.services.FileStorageService;
import com.novaid.services.VisitService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/visits")
public class VisitController {

    private final VisitService visitService;
    private final FileStorageService fileStorageService;

    public VisitController(VisitService visitService, FileStorageService fileStorageService) {
        this.visitService = visitService;
        this.fileStorageService = fileStorageService;
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
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
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

    @PostMapping("/{id}/checkin")
    public VisitResponse checkIn(@PathVariable Long id, @Valid @RequestBody CheckInRequest request) {
        return visitService.checkInLocation(id, request.getLatitude(), request.getLongitude());
    }

    @PostMapping("/{id}/proof-photo")
    public ResponseEntity<String> uploadProofPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        String filePath = fileStorageService.saveProofPhoto(file);
        visitService.attachProofPhoto(id, filePath);
        return ResponseEntity.ok(filePath);
    }
}