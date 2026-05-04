package com.ldh.backend.web;

import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
		String msg = ex.getBindingResult().getFieldErrors().stream()
				.map(GlobalExceptionHandler::formatFieldError)
				.collect(Collectors.joining("; "));
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, msg);
		pd.setTitle("Validación");
		return pd;
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ProblemDetail handleStatus(ResponseStatusException ex) {
		HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, ex.getReason() != null ? ex.getReason() : status.name());
		pd.setTitle(status.name());
		return pd;
	}

	private static String formatFieldError(FieldError e) {
		return e.getField() + ": " + e.getDefaultMessage();
	}
}
