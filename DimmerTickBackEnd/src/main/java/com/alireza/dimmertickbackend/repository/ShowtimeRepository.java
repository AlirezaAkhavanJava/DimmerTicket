package com.alireza.dimmertickbackend.repository;

import com.alireza.dimmertickbackend.domain.movie.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {

    /** One showtime with its hall and seat rows, so the seat layout can be built. */
    @Query("select s from Showtime s join fetch s.hall h left join fetch h.rows where s.id = :id")
    Optional<Showtime> findWithLayout(@Param("id") Long id);

    /** Upcoming showtimes with their movie and seat layout, for the live stats. */
    @Query("select distinct s from Showtime s join fetch s.movie join fetch s.hall h left join fetch h.rows " +
            "where s.startsAt >= :from and s.startsAt < :to")
    List<Showtime> findUpcomingWithLayout(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** All showtimes of one movie that start on the given day, with cinema and hall names. */
    @Query("select s from Showtime s join fetch s.hall h join fetch h.cinema " +
            "where s.movie.id = :movieId and s.startsAt >= :from and s.startsAt < :to " +
            "order by s.startsAt")
    List<Showtime> findForMovie(@Param("movieId") Long movieId,
                                @Param("from") LocalDateTime from,
                                @Param("to") LocalDateTime to);
}