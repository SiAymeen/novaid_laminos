package com.novaid.dto;

public class ItemAlertDto {
    private Long _id;
    private String name;
    private int quantity;
    private int minThreshold;
    private String unit;

    public ItemAlertDto(Long _id, String name, int quantity, int minThreshold, String unit) {
        this._id = _id;
        this.name = name;
        this.quantity = quantity;
        this.minThreshold = minThreshold;
        this.unit = unit;
    }

    public Long get_id() { return _id; }
    public void set_id(Long _id) { this._id = _id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public int getMinThreshold() { return minThreshold; }
    public void setMinThreshold(int minThreshold) { this.minThreshold = minThreshold; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
}
