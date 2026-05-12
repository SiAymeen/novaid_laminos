package com.novaid.dto;

import java.util.List;

public class AlertsResponse {
    private List<FamilyAlertDto> urgentFamilies;
    private List<FamilyAlertDto> forgottenFamilies;
    private List<ItemAlertDto> lowStockItems;
    private List<ReportAlertDto> recentReports;

    public AlertsResponse(List<FamilyAlertDto> urgentFamilies, List<FamilyAlertDto> forgottenFamilies,
                          List<ItemAlertDto> lowStockItems, List<ReportAlertDto> recentReports) {
        this.urgentFamilies = urgentFamilies;
        this.forgottenFamilies = forgottenFamilies;
        this.lowStockItems = lowStockItems;
        this.recentReports = recentReports;
    }

    public List<FamilyAlertDto> getUrgentFamilies() { return urgentFamilies; }
    public void setUrgentFamilies(List<FamilyAlertDto> urgentFamilies) { this.urgentFamilies = urgentFamilies; }

    public List<FamilyAlertDto> getForgottenFamilies() { return forgottenFamilies; }
    public void setForgottenFamilies(List<FamilyAlertDto> forgottenFamilies) { this.forgottenFamilies = forgottenFamilies; }

    public List<ItemAlertDto> getLowStockItems() { return lowStockItems; }
    public void setLowStockItems(List<ItemAlertDto> lowStockItems) { this.lowStockItems = lowStockItems; }

    public List<ReportAlertDto> getRecentReports() { return recentReports; }
    public void setRecentReports(List<ReportAlertDto> recentReports) { this.recentReports = recentReports; }
}
