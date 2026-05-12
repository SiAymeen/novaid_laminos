package com.novaid.dto;

import java.time.LocalDateTime;
import java.util.List;

public class FamilyAlertDto {
    private Long _id;
    private String name;
    private String address;
    private List<String> needs;
    private String alertType;
    private LocalDateTime lastVisitDate;

    public FamilyAlertDto(Long _id, String name, String address, List<String> needs, String alertType, LocalDateTime lastVisitDate) {
        this._id = _id;
        this.name = name;
        this.address = address;
        this.needs = needs;
        this.alertType = alertType;
        this.lastVisitDate = lastVisitDate;
    }

    public Long get_id() { return _id; }
    public void set_id(Long _id) { this._id = _id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public List<String> getNeeds() { return needs; }
    public void setNeeds(List<String> needs) { this.needs = needs; }

    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }

    public LocalDateTime getLastVisitDate() { return lastVisitDate; }
    public void setLastVisitDate(LocalDateTime lastVisitDate) { this.lastVisitDate = lastVisitDate; }
}
