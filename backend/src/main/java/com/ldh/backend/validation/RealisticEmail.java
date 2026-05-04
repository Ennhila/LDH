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
@Constraint(validatedBy = RealisticEmailValidator.class)
public @interface RealisticEmail {

	String message() default "Introduce un correo electrónico válido (dominio con extensión real)";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
