package com.ldh.backend.validation;

import java.util.regex.Pattern;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * CP España: formato provincial + rechazo de secuencias/repdigits típicas de prueba.
 */
public class SpanishPostalCodeValidator implements ConstraintValidator<SpanishPostalCode, String> {

	private static final Pattern SPAIN_CP = Pattern
			.compile("^(?:(?:0[1-9]|[1-4][0-9]|5[0-2])\\d{3}|(?:35|38)\\d{3})$");

	@Override
	public boolean isValid(String value, ConstraintValidatorContext context) {
		if (value == null || value.isBlank()) {
			return true;
		}
		String n = value.trim().replaceAll("\\D", "");
		if (n.length() != 5) {
			return false;
		}
		if (isAllSameDigit(n)) {
			return false;
		}
		if (isSequential(n)) {
			return false;
		}
		return SPAIN_CP.matcher(n).matches();
	}

	private static boolean isAllSameDigit(String s) {
		char c = s.charAt(0);
		for (int i = 1; i < s.length(); i++) {
			if (s.charAt(i) != c) {
				return false;
			}
		}
		return true;
	}

	private static boolean isSequential(String s) {
		boolean asc = true;
		boolean desc = true;
		for (int i = 1; i < s.length(); i++) {
			int d = s.charAt(i) - s.charAt(i - 1);
			if (d != 1) {
				asc = false;
			}
			if (d != -1) {
				desc = false;
			}
		}
		return asc || desc;
	}
}
