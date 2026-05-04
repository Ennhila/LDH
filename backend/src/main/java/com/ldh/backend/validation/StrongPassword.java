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
@Constraint(validatedBy = StrongPasswordValidator.class)
public @interface StrongPassword {

	String message() default "La contraseña debe tener entre 8 y 128 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};
}
