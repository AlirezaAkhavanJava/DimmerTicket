package com.alireza.dimmertickbackend.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/** One auditorium inside a cinema. */
@Entity
@Table(name = "halls")
@Getter
@Setter
@NoArgsConstructor
public class Hall {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cinema_id", nullable = false)
    private Cinema cinema;

    @Column(nullable = false, length = 50)
    private String name;

    // cascade + orphanRemoval: saving a hall saves its rows, and removing a row deletes it.
    @OneToMany(mappedBy = "hall", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("rowLabel ASC")
    private List<HallRow> rows = new ArrayList<>();
}