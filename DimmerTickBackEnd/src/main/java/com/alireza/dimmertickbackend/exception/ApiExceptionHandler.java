package com.alireza.dimmertickbackend.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Turns exceptions into JSON like:
 * { "status": 409, "message": "This username is already taken" }
 * The front-end reads "message" directly.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    /**
     * Errors thrown on purpose in services: 404 not found, 409 conflict, 401 unauthorized...
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        String message = ex.getReason() != null ? ex.getReason() : "Request failed.";
        return body(ex.getStatusCode().value(), message);
    }

    /**
     * A request broke a validation rule such as @NotBlank or @Size.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        // One message per field. putIfAbsent keeps the first message if a field fails twice.
        Map<String, String> fields = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fields.putIfAbsent(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("message", "Some fields are not valid");
        response.put("fields", fields);
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * The database refused to write, usually a duplicate value or a row that other data still uses.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleIntegrity(DataIntegrityViolationException ex) {
        return body(HttpStatus.CONFLICT.value(),
                "This action conflicts with existing data (a duplicate value, or other data still depends on it).");
    }

    private ResponseEntity<Map<String, Object>> body(int status, String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", status);
        response.put("message", message);
        return ResponseEntity.status(status).body(response);
    }
}