package com.alireza.dimmertickbackend.repository;

import com.alireza.dimmertickbackend.domain.ticketHall.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    /** Seat labels that are already sold for one showtime. The database is the final authority. */
    @Query("select t.seat from Ticket t where t.showtime.id = :showtimeId")
    List<String> findSoldSeats(@Param("showtimeId") Long showtimeId);

    /** Rows of [showtimeId, soldCount]. */
    @Query("select t.showtime.id, count(t) from Ticket t where t.showtime.id in :ids group by t.showtime.id")
    List<Object[]> countSoldByShowtime(@Param("ids") Collection<Long> ids);

    /** Rows of [showtimeId, soldCountSince]. */
    @Query("select t.showtime.id, count(t) from Ticket t " +
            "where t.showtime.id in :ids and t.createdAt >= :since group by t.showtime.id")
    List<Object[]> countSoldSince(@Param("ids") Collection<Long> ids, @Param("since") Instant since);
}