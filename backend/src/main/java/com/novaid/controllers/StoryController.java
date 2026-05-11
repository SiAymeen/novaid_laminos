package com.novaid.controllers;

import com.novaid.models.Family;
import com.novaid.repositories.FamilyRepository;
import com.novaid.services.StoryGeneratorService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stories")
public class StoryController {

    private final StoryGeneratorService storyGeneratorService;
    private final FamilyRepository familyRepository;

    public StoryController(StoryGeneratorService storyGeneratorService, FamilyRepository familyRepository) {
        this.storyGeneratorService = storyGeneratorService;
        this.familyRepository = familyRepository;
    }

    @GetMapping("/family/{id}")
    public String generateFamilyStory(@PathVariable Long id) {
        Family family = familyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Family not found"));

        return storyGeneratorService.generateFamilyStory(family);
    }
}