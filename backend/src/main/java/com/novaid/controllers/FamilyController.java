package com.novaid.controllers;

import com.novaid.dto.FamilyRequest;
import com.novaid.dto.FamilyResponse;
import com.novaid.services.FamilyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/families")
public class FamilyController {

    private final FamilyService familyService;

    public FamilyController(FamilyService familyService) {
        this.familyService = familyService;
    }

    @GetMapping
    public List<FamilyResponse> getAllFamilies() {
        return familyService.getAll();
    }

    @GetMapping("/{id}")
    public FamilyResponse getFamily(@PathVariable Long id) {
        return familyService.getById(id);
    }

    @PostMapping
    public ResponseEntity<FamilyResponse> createFamily(@Valid @RequestBody FamilyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(familyService.create(request));
    }

    @PutMapping("/{id}")
    public FamilyResponse updateFamily(@PathVariable Long id, @Valid @RequestBody FamilyRequest request) {
        return familyService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFamily(@PathVariable Long id) {
        familyService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/distance")
    public Map<String, Object> getDistanceToCenter(@PathVariable Long id) {
        return familyService.getDistanceToCenter(id);
    }
}
