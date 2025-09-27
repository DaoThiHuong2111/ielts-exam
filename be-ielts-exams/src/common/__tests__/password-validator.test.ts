import { PasswordValidator } from "../password-validator";

describe("PasswordValidator", () => {
  describe("validate", () => {
    it("should validate a strong password", () => {
      const password = "StrongP@ssw0rd";
      const result = PasswordValidator.validate(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject a password that is too short", () => {
      const password = "Short1!";
      const result = PasswordValidator.validate(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must be at least 8 characters long");
    });

    it("should reject a password without uppercase letters", () => {
      const password = "lowercasep@ssw0rd";
      const result = PasswordValidator.validate(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one uppercase letter");
    });

    it("should reject a password without lowercase letters", () => {
      const password = "UPPERCASEP@SSW0RD";
      const result = PasswordValidator.validate(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one lowercase letter");
    });

    it("should reject a password without numbers", () => {
      const password = "NoNumbers@Password";
      const result = PasswordValidator.validate(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one number");
    });

    it("should reject a password without special characters", () => {
      const password = "NoSpecialCharsPassword1";
      const result = PasswordValidator.validate(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password must contain at least one special character");
    });

    it("should reject a password with common words", () => {
      const password = "Password123!";
      const result = PasswordValidator.validate(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password cannot contain common words like "password"');
    });

    it("should reject a password with repeated characters", () => {
      const password = "Passswoord123!";
      const result = PasswordValidator.validate(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password contains predictable patterns");
    });

    it("should reject a password with sequential numbers", () => {
      const password = "Password123!";
      const result = PasswordValidator.validate(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password contains predictable patterns");
    });

    it("should reject a password with sequential letters", () => {
      const password = "Abcdefgh1!";
      const result = PasswordValidator.validate(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password contains predictable patterns");
    });

    it("should validate with custom options", () => {
      const password = "CustomP@ss";
      const options = {
        minLength: 6,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: false,
        requireSpecialChars: false
      };
      const result = PasswordValidator.validate(password, options);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("validateOrThrow", () => {
    it("should not throw for a valid password", () => {
      const password = "ValidP@ssw0rd";

      expect(() => {
        PasswordValidator.validateOrThrow(password);
      }).not.toThrow();
    });

    it("should throw for an invalid password", () => {
      const password = "weak";

      expect(() => {
        PasswordValidator.validateOrThrow(password);
      }).toThrow();
    });
  });

  describe("isStrong", () => {
    it("should return true for a strong password", () => {
      const password = "StrongP@ssw0rd";

      expect(PasswordValidator.isStrong(password)).toBe(true);
    });

    it("should return false for a weak password", () => {
      const password = "weak";

      expect(PasswordValidator.isStrong(password)).toBe(false);
    });
  });

  describe("getStrengthScore", () => {
    it("should return a high score for a strong password", () => {
      const password = "VeryStrongP@ssw0rdWithLength!";
      const score = PasswordValidator.getStrengthScore(password);

      expect(score).toBeGreaterThan(80);
    });

    it("should return a low score for a weak password", () => {
      const password = "weak";
      const score = PasswordValidator.getStrengthScore(password);

      expect(score).toBeLessThan(20);
    });

    it("should penalize for common patterns", () => {
      const passwordWithRepeats = "Passswoord123!";
      const passwordSequential = "Abcdefgh123!";

      const scoreWithRepeats = PasswordValidator.getStrengthScore(passwordWithRepeats);
      const scoreSequential = PasswordValidator.getStrengthScore(passwordSequential);

      const baseScore = PasswordValidator.getStrengthScore("Password123!");

      expect(scoreWithRepeats).toBeLessThan(baseScore);
      expect(scoreSequential).toBeLessThan(baseScore);
    });
  });

  describe("getStrengthDescription", () => {
    it('should return "Very Strong" for a very strong password', () => {
      const password = "VeryStrongP@ssw0rdWithLength!";
      const description = PasswordValidator.getStrengthDescription(password);

      expect(description).toBe("Very Strong");
    });

    it('should return "Strong" for a strong password', () => {
      const password = "StrongP@ssw0rd";
      const description = PasswordValidator.getStrengthDescription(password);

      expect(description).toBe("Strong");
    });

    it('should return "Medium" for a medium password', () => {
      const password = "MediumPass1";
      const description = PasswordValidator.getStrengthDescription(password);

      expect(description).toBe("Medium");
    });

    it('should return "Weak" for a weak password', () => {
      const password = "weakpass";
      const description = PasswordValidator.getStrengthDescription(password);

      expect(description).toBe("Weak");
    });

    it('should return "Very Weak" for a very weak password', () => {
      const password = "123";
      const description = PasswordValidator.getStrengthDescription(password);

      expect(description).toBe("Very Weak");
    });
  });

  describe("generateSecurePassword", () => {
    it("should generate a password of the specified length", () => {
      const length = 12;
      const password = PasswordValidator.generateSecurePassword(length);

      expect(password.length).toBe(length);
    });

    it("should generate a password that passes validation", () => {
      const password = PasswordValidator.generateSecurePassword();
      const result = PasswordValidator.validate(password);

      expect(result.isValid).toBe(true);
    });

    it("should generate different passwords on each call", () => {
      const password1 = PasswordValidator.generateSecurePassword();
      const password2 = PasswordValidator.generateSecurePassword();

      expect(password1).not.toBe(password2);
    });

    it("should contain at least one character from each category", () => {
      const password = PasswordValidator.generateSecurePassword();

      expect(password).toMatch(/[a-z]/); // lowercase
      expect(password).toMatch(/[A-Z]/); // uppercase
      expect(password).toMatch(/[0-9]/); // number
      expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/); // special char
    });
  });
});
