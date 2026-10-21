package com.alireza.dimmertickbackend.domain.stat;

public enum MovieStatus {
    DRAFT,         // being edited, not on the site
    NOW_SHOWING,   // bookable now
    COMING_SOON,   // listed, not bookable
    ARCHIVED       // hidden, but kept so old tickets still point to a movie
}
