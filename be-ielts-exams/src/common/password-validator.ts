import { BadRequestException } from "@nestjs/common";

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordValidationOptions {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  forbiddenWords?: string[];
  forbiddenPatterns?: RegExp[];
}

export class PasswordValidator {
  private static readonly defaultOptions: Required<PasswordValidationOptions> = {
    minLength: 8,
    maxLength: 64,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    forbiddenWords: ["password", "123456", "qwerty", "admin", "user"],
    forbiddenPatterns: [
      /(.)\1{2,}/, // Prevent 3 or more repeated characters
      /012|123|234|345|456|567|678|789|890/, // Prevent sequential numbers
      /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i // Prevent sequential letters
    ]
  };

  /**
   * Validate a password against security requirements
   */
  static validate(password: string, options?: PasswordValidationOptions): PasswordValidationResult {
    const finalOptions = { ...this.defaultOptions, ...options };
    const errors: string[] = [];

    // Check length
    if (password.length < finalOptions.minLength) {
      errors.push(`Password must be at least ${finalOptions.minLength} characters long`);
    }

    if (password.length > finalOptions.maxLength) {
      errors.push(`Password must be no more than ${finalOptions.maxLength} characters long`);
    }

    // Check for uppercase letters
    if (finalOptions.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    // Check for lowercase letters
    if (finalOptions.requireLowercase && !/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    // Check for numbers
    if (finalOptions.requireNumbers && !/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    // Check for special characters
    if (finalOptions.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    // Check for forbidden words
    const lowerPassword = password.toLowerCase();
    for (const word of finalOptions.forbiddenWords) {
      if (lowerPassword.includes(word)) {
        errors.push(`Password cannot contain common words like "${word}"`);
      }
    }

    // Check for forbidden patterns
    for (const pattern of finalOptions.forbiddenPatterns) {
      if (pattern.test(password)) {
        errors.push("Password contains predictable patterns");
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate password and throw exception if invalid
   */
  static validateOrThrow(password: string, options?: PasswordValidationOptions): void {
    const result = this.validate(password, options);

    if (!result.isValid) {
      throw new BadRequestException({
        message: "Password validation failed",
        errors: result.errors,
        statusCode: 400
      });
    }
  }

  /**
   * Check if password is strong (meets all requirements)
   */
  static isStrong(password: string, options?: PasswordValidationOptions): boolean {
    return this.validate(password, options).isValid;
  }

  /**
   * Get password strength score (0-100)
   */
  static getStrengthScore(password: string): number {
    let score = 0;

    // Length contributes up to 40 points
    score += Math.min(40, password.length * 2);

    // Character variety contributes up to 60 points
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

    // Bonus for length over 12 characters
    if (password.length > 12) score += 10;

    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) score -= 10;
    if (/012|123|234|345|456|567|678|789|890/.test(password)) score -= 10;
    if (
      /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)
    )
      score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get password strength description
   */
  static getStrengthDescription(password: string): string {
    const score = this.getStrengthScore(password);

    if (score >= 80) return "Very Strong";
    if (score >= 60) return "Strong";
    if (score >= 40) return "Medium";
    if (score >= 20) return "Weak";
    return "Very Weak";
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 12): string {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    const allChars = lowercase + uppercase + numbers + specialChars;
    let password = "";

    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }
}
