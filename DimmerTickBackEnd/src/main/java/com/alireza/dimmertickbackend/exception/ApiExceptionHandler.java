package com.alireza.dimmertickbackend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * One place for every API error. The response always looks like:
 * { "status": 409, "message": "...", "fields": { ... } }   (fields only for validation errors)
 * The front-end shows "message" directly.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    /** Errors thrown on purpose in services: 404 not found, 409 conflict, 401 unauthorized... */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        String message = ex.getReason() != null ? ex.getReason() : "Request failed.";
        return body(ex.getStatusCode().value(), message);
    }

    /** Signed in, but the action is not allowed for this account. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return body(HttpStatus.FORBIDDEN.value(), "You do not have permission to do this.");
    }

    /** A form field broke a rule such as @NotBlank or @Size. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
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

    /** The request body is missing, empty, or not valid JSON. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException ex) {
        return body(HttpStatus.BAD_REQUEST.value(),
                "The form data is missing or could not be read. Fill in the form and try again.");
    }

    /** A URL value has the wrong type, for example a letter where a movie number should be. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return body(HttpStatus.BAD_REQUEST.value(),
                "The value for '" + ex.getName() + "' is not valid.");
    }

    /** The page used the wrong HTTP method, for example GET where POST is needed. */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethod(HttpRequestMethodNotSupportedException ex) {
        return body(HttpStatus.METHOD_NOT_ALLOWED.value(), "This action is not allowed here.");
    }

    /** The address does not exist. */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NoResourceFoundException ex) {
        return body(HttpStatus.NOT_FOUND.value(), "Nothing exists at this address.");
    }

    /** The database refused to write, usually a duplicate value or a row other data still uses. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleIntegrity(DataIntegrityViolationException ex) {
        log.warn("Database rejected a write: {}", ex.getMostSpecificCause().getMessage());
        return body(HttpStatus.CONFLICT.value(),
                "This action conflicts with existing data (a duplicate value, or other data still depends on it).");
    }

    /** Anything unexpected. The real error goes to the server log, never to the browser. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        return body(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Something went wrong on our side. Please try again in a moment.");
    }

    private ResponseEntity<Map<String, Object>> body(int status, String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", status);
        response.put("message", message);
        return ResponseEntity.status(status).body(response);
    }
}