package com.alireza.dimmertickbackend.repository;

import com.alireza.dimmertickbackend.domain.movie.ShowtimeTierPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShowtimeTierPriceRepository extends JpaRepository<ShowtimeTierPrice, Long> {

    List<ShowtimeTierPrice> findByShowtimeId(Long showtimeId);
}