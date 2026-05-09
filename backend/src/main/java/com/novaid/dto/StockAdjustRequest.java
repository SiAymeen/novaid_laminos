package com.novaid.dto;

import jakarta.validation.constraints.Min;

public class StockAdjustRequest {

    @Min(1)
    private int quantity;

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}
