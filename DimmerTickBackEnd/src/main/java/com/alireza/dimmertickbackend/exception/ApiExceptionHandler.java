package com.alireza.dimmertickbackend.exception;


import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Turns errors into clean JSON, for example:
 * { "status": 404, "message": "User not found" }
 * The front-end can show "message" directly.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    /** Errors we throw on purpose: 404 not found, 409 conflict, 400 bad request... */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        return body(ex.getStatusCode().value(), ex.getReason());
    }

    /** A request that breaks a validation rule (@NotBlank, @Email, @Size...). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fields = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("message", "Some fields are not valid");
        response.put("fields", fields);
        return ResponseEntity.badRequest().body(response);
    }

    /** The database refused: a duplicate value, or other data still depends on this row. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleIntegrity(DataIntegrityViolationException ex) {
        return body(HttpStatus.CONFLICT.value(),
                "This action conflicts with existing data (a duplicate value, or other data still depends on it)");
    }

    private ResponseEntity<Map<String, Object>> body(int status, String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", status);
        response.put("message", message);
        return ResponseEntity.status(status).body(response);
    }
}