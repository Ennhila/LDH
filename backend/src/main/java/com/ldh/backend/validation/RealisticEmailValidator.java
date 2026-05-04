package com.ldh.backend.validation;

import java.util.regex.Pattern;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Complementa {@code @Email}: exige TLD de al menos 2 letras y estructura habitual (no "a@b").
 */
public class RealisticEmailValidator implements ConstraintValidator<RealisticEmail, String> {

	private static final Pattern REALISTIC = Pattern.compile(
			"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\\.[a-zA-Z]{2,}$");

	@Override
	public boolean isValid(String value, ConstraintValidatorContext context) {
		if (value == null || value.isBlank()) {
			return false;
		}
		String t = value.trim();
		return REALISTIC.matcher(t).matches() && !t.contains("..");
	}
}
