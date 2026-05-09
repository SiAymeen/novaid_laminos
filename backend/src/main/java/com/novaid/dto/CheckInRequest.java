package com.novaid.dto;

import jakarta.validation.constraints.NotNull;

public class CheckInRequest {

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}
