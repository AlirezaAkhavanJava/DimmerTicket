package com.alireza.dimmertickbackend.repository;


import com.alireza.dimmertickbackend.domain.WatchlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, Long> {

    /**
     * Used when an account is deleted: its saved movies go with it.
     */
    void deleteByUserId(UUID userId);
}