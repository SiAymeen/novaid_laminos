package com.novaid.dto;

import java.time.LocalDateTime;

public class ReportAlertDto {
    private Long _id;
    private String familyName;
    private String volunteerName;
    private LocalDateTime date;
    private String notes;

    public ReportAlertDto(Long _id, String familyName, String volunteerName, LocalDateTime date, String notes) {
        this._id = _id;
        this.familyName = familyName;
        this.volunteerName = volunteerName;
        this.date = date;
        this.notes = notes;
    }

    public Long get_id() { return _id; }
    public void set_id(Long _id) { this._id = _id; }

    public String getFamilyName() { return familyName; }
    public void setFamilyName(String familyName) { this.familyName = familyName; }

    public String getVolunteerName() { return volunteerName; }
    public void setVolunteerName(String volunteerName) { this.volunteerName = volunteerName; }

    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
