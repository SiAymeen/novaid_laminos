package com.novaid.controllers;

import com.novaid.dto.ItemRequest;
import com.novaid.dto.ItemResponse;
import com.novaid.dto.StockAdjustRequest;
import com.novaid.services.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public List<ItemResponse> getAllItems() {
        return inventoryService.getAll();
    }

    @GetMapping("/{id}")
    public ItemResponse getItem(@PathVariable Long id) {
        return inventoryService.getById(id);
    }

    @PostMapping
    public ResponseEntity<ItemResponse> createItem(@Valid @RequestBody ItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.create(request));
    }

    @PutMapping("/{id}")
    public ItemResponse updateItem(@PathVariable Long id, @Valid @RequestBody ItemRequest request) {
        return inventoryService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        inventoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/add-stock")
    public ItemResponse addStock(@PathVariable Long id, @Valid @RequestBody StockAdjustRequest request) {
        return inventoryService.addStock(id, request.getQuantity());
    }

    @PutMapping("/{id}/remove-stock")
    public ItemResponse removeStock(@PathVariable Long id, @Valid @RequestBody StockAdjustRequest request) {
        return inventoryService.removeStock(id, request.getQuantity());
    }
}
