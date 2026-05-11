package com.novaid.services;

import com.novaid.models.Family;
import org.springframework.stereotype.Service;

@Service
public class StoryGeneratorService {

    public String generateFamilyStory(Family family) {
        String headName = family.getHeadName();
        String address = family.getAddress();
        int urgency = family.getUrgencyIndex();

        String urgencyText = urgency >= 7
                ? "La situation est considérée comme urgente."
                : "La situation est actuellement stable.";

        return "La famille " + headName + ", située à " + address
                + ", bénéficie d’un suivi social dans la plateforme NOVAID. "
                + urgencyText
                + " Les besoins déclarés sont : "
                + String.join(", ", family.getNeeds())
                + ".";
    }
}