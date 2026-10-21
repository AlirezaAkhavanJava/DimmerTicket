package com.alireza.dimmertickbackend.domain;

import java.util.List;

/** The avatars a user can choose. These keys must match js/avatars.js. */
public final class AvatarCatalog {

    public static final String DEFAULT = "avatar-01";

    public static final List<String> KEYS = List.of(
            "avatar-01", "avatar-02", "avatar-03", "avatar-04",
            "avatar-05", "avatar-06", "avatar-07", "avatar-08");

    private AvatarCatalog() {
    }

    public static boolean isValid(String key) {
        return key != null && KEYS.contains(key);
    }
}
