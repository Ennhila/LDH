package com.ldh.backend.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Constraint(validatedBy = SpanishPostalCodeValidator.class)
public @interface SpanishPostalCode {

	String message() default "Código postal no válido para España";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
