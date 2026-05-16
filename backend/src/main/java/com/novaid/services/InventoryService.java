package com.novaid.services;

import com.novaid.dto.ItemRequest;
import com.novaid.dto.ItemResponse;
import com.novaid.models.Item;
import com.novaid.repositories.InventoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final SmsService smsService;
    private final WhatsAppService whatsAppService;

    public InventoryService(InventoryRepository inventoryRepository, SmsService smsService, WhatsAppService whatsAppService) {
        this.inventoryRepository = inventoryRepository;
        this.smsService = smsService;
        this.whatsAppService = whatsAppService;
    }

    @Transactional(readOnly = true)
    public List<ItemResponse> getAll() {
        return inventoryRepository.findAll().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ItemResponse getById(Long id) {
        return toResponse(findItem(id));
    }

    public ItemResponse create(ItemRequest request) {
        Item item = new Item();
        applyRequest(item, request);
        return toResponse(inventoryRepository.save(item));
    }

    public ItemResponse update(Long id, ItemRequest request) {
        Item item = findItem(id);
        applyRequest(item, request);
        return toResponse(inventoryRepository.save(item));
    }

    public void delete(Long id) {
        inventoryRepository.delete(findItem(id));
    }

    // Atomically adds stock — quantity must be positive
    public ItemResponse addStock(Long id, int quantity) {
        if (quantity <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be positive");
        }
        Item item = findItem(id);
        item.setQuantity(item.getQuantity() + quantity);
        return toResponse(inventoryRepository.save(item));
    }

    // Atomically removes stock — rejects if not enough stock available
    public ItemResponse removeStock(Long id, int quantity) {
        if (quantity <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be positive");
        }
        Item item = findItem(id);
        if (item.getQuantity() < quantity) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Insufficient stock: available=" + item.getQuantity() + ", requested=" + quantity);
        }
        boolean wasOk = item.getQuantity() > item.getMinThreshold();
        item.setQuantity(item.getQuantity() - quantity);
        Item saved = inventoryRepository.save(item);
        if (wasOk && saved.getQuantity() <= saved.getMinThreshold()) {
            String msg = "NOVAID ALERTE: Stock faible - " + saved.getName() +
                " (qte: " + saved.getQuantity() + ", seuil: " + saved.getMinThreshold() + "). Reapprovisionner svp.";
            smsService.sendToAllUsers(msg);
            whatsAppService.sendToAllUsers(msg);
        }
        return toResponse(saved);
    }

    private Item findItem(Long id) {
        return inventoryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
    }

    private void applyRequest(Item item, ItemRequest request) {
        item.setName(request.getName());
        item.setCategory(request.getCategory());
        item.setQuantity(request.getQuantity());
        item.setUnit(request.getUnit());
        item.setMinThreshold(request.getMinThreshold());
    }

    private ItemResponse toResponse(Item item) {
        ItemResponse response = new ItemResponse();
        response.setId(item.getId());
        response.setName(item.getName());
        response.setCategory(item.getCategory());
        response.setQuantity(item.getQuantity());
        response.setUnit(item.getUnit());
        response.setMinThreshold(item.getMinThreshold());
        return response;
    }
}
