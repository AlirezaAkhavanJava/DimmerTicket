package com.alireza.dimmertickbackend.repository;


import com.alireza.dimmertickbackend.domain.AppUser;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    /**
     * Used when editing: the email may match another user, but not the same user.
     */
    boolean existsByEmailIgnoreCaseAndIdNot(String email, UUID id);

    /**
     * Search by username OR full name. The Pageable limits how many results come back.
     */
    List<AppUser> findByUsernameContainingIgnoreCaseOrFullNameContainingIgnoreCase(
            String username, String fullName, Pageable pageable);

    Optional<AppUser> findByEmailIgnoreCase(String email);
}