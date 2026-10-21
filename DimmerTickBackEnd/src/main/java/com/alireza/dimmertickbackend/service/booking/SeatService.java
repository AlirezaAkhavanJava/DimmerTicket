package com.alireza.dimmertickbackend.service.booking;

import com.alireza.dimmertickbackend.domain.dto.booking.BookingDtos.HoldResponse;
import com.alireza.dimmertickbackend.domain.dto.booking.BookingDtos.SeatMap;
import com.alireza.dimmertickbackend.domain.dto.booking.BookingDtos.SeatView;
import com.alireza.dimmertickbackend.domain.dto.booking.BookingDtos.SellingFastItem;
import com.alireza.dimmertickbackend.domain.dto.booking.BookingDtos.ShowtimeItem;
import com.alireza.dimmertickbackend.domain.movie.Showtime;
import com.alireza.dimmertickbackend.domain.movie.ShowtimeTierPrice;
import com.alireza.dimmertickbackend.domain.stat.SeatTier;
import com.alireza.dimmertickbackend.domain.ticketHall.Hall;
import com.alireza.dimmertickbackend.domain.ticketHall.HallRow;
import com.alireza.dimmertickbackend.repository.ShowtimeRepository;
import com.alireza.dimmertickbackend.repository.ShowtimeTierPriceRepository;
import com.alireza.dimmertickbackend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SeatService {

    /** How long a seat stays reserved while the buyer pays. */
    public static final Duration HOLD_TTL = Duration.ofMinutes(10);

    private static final String HOLD_PREFIX = "hold:";

    // Atomic: Redis runs the whole script in one step, so two requests can never both win the same seat.
    // The seat is free if nobody holds it, or if the same user already holds it.
    private static final DefaultRedisScript<Long> HOLD_ALL = new DefaultRedisScript<>();
    private static final DefaultRedisScript<Long> RELEASE = new DefaultRedisScript<>();

    static {
        HOLD_ALL.setResultType(Long.class);
        HOLD_ALL.setScriptText("""
                for i = 1, #KEYS do
                  local owner = redis.call('GET', KEYS[i])
                  if owner and owner ~= ARGV[1] then
                    return 0
                  end
                end
                for i = 1, #KEYS do
                  redis.call('SET', KEYS[i], ARGV[1], 'EX', ARGV[2])
                end
                return 1
                """);

        RELEASE.setResultType(Long.class);
        RELEASE.setScriptText("""
                local released = 0
                for i = 1, #KEYS do
                  if redis.call('GET', KEYS[i]) == ARGV[1] then
                    redis.call('DEL', KEYS[i])
                    released = released + 1
                  end
                end
                return released
                """);
    }

    private final ShowtimeRepository showtimeRepository;
    private final ShowtimeTierPriceRepository tierPriceRepository;
    private final TicketRepository ticketRepository;
    private final StringRedisTemplate redis;

    private record Seat(String label, String row, int number, SeatTier tier) {
    }

    // ------------------------------------------------------------------ public API

    /** Showtimes of one movie on one day, for the details page. */
    @Transactional(readOnly = true)
    public List<ShowtimeItem> showtimesFor(Long movieId, LocalDate date) {
        LocalDateTime from = date.atStartOfDay();
        return showtimeRepository.findForMovie(movieId, from, from.plusDays(1)).stream()
                .map(s -> new ShowtimeItem(s.getId(), movieId,
                        s.getHall().getCinema().getName(), s.getHall().getName(),
                        s.getStartsAt(), s.getBasePrice()))
                .toList();
    }

    /** The full seat map of one showtime, with each seat's status and price. */
    @Transactional(readOnly = true)
    public SeatMap seatMap(Long showtimeId) {
        Showtime show = loadShowtime(showtimeId);
        List<Seat> seats = layout(show.getHall());
        Set<String> sold = new HashSet<>(ticketRepository.findSoldSeats(showtimeId));
        Map<SeatTier, BigDecimal> surcharges = surcharges(showtimeId);

        List<String> owners = seats.isEmpty()
                ? List.of()
                : redis.opsForValue().multiGet(seats.stream().map(s -> holdKey(showtimeId, s.label())).toList());

        List<SeatView> views = new ArrayList<>();
        int soldCount = 0;
        int heldCount = 0;
        for (int i = 0; i < seats.size(); i++) {
            Seat seat = seats.get(i);
            String status;
            if (sold.contains(seat.label())) {
                status = "SOLD";
                soldCount++;
            } else if (owners != null && owners.get(i) != null) {
                status = "HELD";
                heldCount++;
            } else {
                status = "FREE";
            }
            views.add(new SeatView(seat.label(), seat.row(), seat.number(), seat.tier(),
                    priceFor(show, seat.tier(), surcharges), status));
        }

        int total = seats.size();
        return new SeatMap(show.getId(), show.getMovie().getTitle(),
                show.getHall().getCinema().getName(), show.getHall().getName(),
                show.getStartsAt(), total, soldCount, heldCount,
                total - soldCount - heldCount, views);
    }

    /** Reserves the requested seats for this user for 10 minutes. All seats succeed, or none do. */
    @Transactional(readOnly = true)
    public HoldResponse hold(Long showtimeId, UUID userId, List<String> requested) {
        Showtime show = loadShowtime(showtimeId);
        if (!show.getStartsAt().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This show has already started.");
        }

        List<String> labels = requested.stream().map(SeatService::normalise).toList();
        if (new HashSet<>(labels).size() != labels.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each seat can be chosen only once.");
        }

        Map<String, Seat> layout = layout(show.getHall()).stream()
                .collect(Collectors.toMap(Seat::label, s -> s));
        for (String label : labels) {
            if (!layout.containsKey(label)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Seat " + label + " does not exist in this hall.");
            }
        }

        // 1. Sold seats are refused straight away, based on the database.
        Set<String> sold = new HashSet<>(ticketRepository.findSoldSeats(showtimeId));
        List<String> soldNow = labels.stream().filter(sold::contains).toList();
        if (!soldNow.isEmpty()) {
            throw unavailable(soldNow);
        }

        // 2. Redis holds all of them atomically, or refuses all of them.
        List<String> keys = keysFor(showtimeId, labels);
        Long result = redis.execute(HOLD_ALL, keys, userId.toString(), String.valueOf(HOLD_TTL.toSeconds()));
        if (result == null || result == 0L) {
            List<String> owners = redis.opsForValue().multiGet(keys);
            List<String> taken = new ArrayList<>();
            for (int i = 0; i < labels.size(); i++) {
                String owner = owners == null ? null : owners.get(i);
                if (owner != null && !owner.equals(userId.toString())) {
                    taken.add(labels.get(i));
                }
            }
            throw unavailable(taken);
        }

        Map<SeatTier, BigDecimal> surcharges = surcharges(showtimeId);
        BigDecimal total = labels.stream()
                .map(layout::get)
                .map(seat -> priceFor(show, seat.tier(), surcharges))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new HoldResponse(showtimeId, labels, total, Instant.now().plus(HOLD_TTL));
    }

    /** Releases seats this user is holding. Seats held by someone else are never touched. */
    public void release(Long showtimeId, UUID userId, List<String> requested) {
        List<String> labels = requested.stream().map(SeatService::normalise).toList();
        redis.execute(RELEASE, keysFor(showtimeId, labels), userId.toString());
    }

    /** Live sold and remaining numbers per movie, over the next 7 days. */
    @Transactional(readOnly = true)
    public List<SellingFastItem> sellingFast() {
        LocalDateTime now = LocalDateTime.now();
        List<Showtime> shows = showtimeRepository.findUpcomingWithLayout(now, now.plusDays(7));
        if (shows.isEmpty()) {
            return List.of();
        }

        List<Long> ids = shows.stream().map(Showtime::getId).toList();
        Map<Long, Long> soldBy = countMap(ticketRepository.countSoldByShowtime(ids));
        Map<Long, Long> lastHourBy = countMap(
                ticketRepository.countSoldSince(ids, Instant.now().minus(Duration.ofHours(1))));

        Map<Long, MovieTally> tallies = new LinkedHashMap<>();
        for (Showtime show : shows) {
            List<Seat> seats = layout(show.getHall());
            long sold = soldBy.getOrDefault(show.getId(), 0L);
            long lastHour = lastHourBy.getOrDefault(show.getId(), 0L);
            int held = countHeld(show.getId(), seats);

            tallies.computeIfAbsent(show.getMovie().getId(),
                            id -> new MovieTally(id, show.getMovie().getTitle()))
                    .add(seats.size(), sold, held, lastHour);
        }

        return tallies.values().stream()
                .map(MovieTally::toItem)
                .sorted(Comparator.comparingInt(SellingFastItem::percentSold).reversed())
                .toList();
    }

    // ------------------------------------------------------------------ helpers

    private Showtime loadShowtime(Long id) {
        return showtimeRepository.findWithLayout(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "This showtime does not exist."));
    }

    private static List<Seat> layout(Hall hall) {
        List<Seat> seats = new ArrayList<>();
        for (HallRow row : hall.getRows()) {                     // ordered by row label in the entity
            for (int n = 1; n <= row.getSeatCount(); n++) {
                seats.add(new Seat(row.getRowLabel() + n, row.getRowLabel(), n, row.getTier()));
            }
        }
        return seats;
    }

    private Map<SeatTier, BigDecimal> surcharges(Long showtimeId) {
        Map<SeatTier, BigDecimal> map = new EnumMap<>(SeatTier.class);
        for (ShowtimeTierPrice p : tierPriceRepository.findByShowtimeId(showtimeId)) {
            map.put(p.getTier(), p.getSurcharge());
        }
        return map;
    }

    /** Final seat price = showtime base price + the seat tier's fee for this showtime. */
    private static BigDecimal priceFor(Showtime show, SeatTier tier, Map<SeatTier, BigDecimal> surcharges) {
        return show.getBasePrice().add(surcharges.getOrDefault(tier, BigDecimal.ZERO));
    }

    private int countHeld(Long showtimeId, List<Seat> seats) {
        if (seats.isEmpty()) {
            return 0;
        }
        List<String> owners = redis.opsForValue().multiGet(
                seats.stream().map(s -> holdKey(showtimeId, s.label())).toList());
        int held = 0;
        if (owners != null) {
            for (String owner : owners) {
                if (owner != null) {
                    held++;
                }
            }
        }
        return held;
    }

    private static String holdKey(Long showtimeId, String label) {
        return HOLD_PREFIX + showtimeId + ":" + label;
    }

    private static List<String> keysFor(Long showtimeId, List<String> labels) {
        return labels.stream().map(l -> holdKey(showtimeId, l)).toList();
    }

    private static String normalise(String label) {
        return label.trim().toUpperCase(Locale.ROOT);
    }

    private static ResponseStatusException unavailable(List<String> seats) {
        String message;
        if (seats.isEmpty()) {
            message = "Those seats are no longer available. Please try again.";
        } else if (seats.size() == 1) {
            message = "Seat " + seats.get(0) + " was just taken. Please choose another seat.";
        } else {
            message = "Seats " + String.join(", ", seats) + " were just taken. Please choose other seats.";
        }
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }

    private static Map<Long, Long> countMap(List<Object[]> rows) {
        Map<Long, Long> out = new HashMap<>();
        for (Object[] row : rows) {
            out.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
        }
        return out;
    }

    /** Adds up the seats of every showtime of one movie. */
    private static final class MovieTally {
        private final Long movieId;
        private final String title;
        private long seats;
        private long sold;
        private long held;
        private long lastHour;

        MovieTally(Long movieId, String title) {
            this.movieId = movieId;
            this.title = title;
        }

        void add(long totalSeats, long soldSeats, long heldSeats, long recentSales) {
            seats += totalSeats;
            sold += soldSeats;
            held += heldSeats;
            lastHour += recentSales;
        }

        SellingFastItem toItem() {
            long remaining = Math.max(0, seats - sold - held);
            int percent = seats == 0 ? 0 : (int) Math.round(sold * 100.0 / seats);
            return new SellingFastItem(movieId, title, (int) seats, (int) sold, (int) held,
                    (int) remaining, (int) lastHour, percent);
        }
    }
}