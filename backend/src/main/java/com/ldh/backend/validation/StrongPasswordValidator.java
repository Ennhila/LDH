package com.ldh.backend.validation;

import java.util.regex.Pattern;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

	/**
	 * Mayúscula, minúscula, dígito y carácter que no sea letra ni dígito (símbolo). Unicode para nombres en español.
	 */
	private static final Pattern STRONG = Pattern.compile(
			"^(?=.*\\p{Lu})(?=.*\\p{Ll})(?=.*\\p{N})(?=.*[^\\p{L}\\p{N}\\s]).{8,128}$");

	@Override
	public boolean isValid(String value, ConstraintValidatorContext context) {
		if (value == null || value.isBlank()) {
			return false;
		}
		return STRONG.matcher(value).matches();
	}
}
