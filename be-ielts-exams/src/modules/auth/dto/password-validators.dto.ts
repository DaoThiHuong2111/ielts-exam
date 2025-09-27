import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";
import { PasswordValidator } from "../../../common/password-validator";

// Custom validator for password strength
@ValidatorConstraint({ name: "isStrongPassword", async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string) {
    // Chỉ yêu cầu mật khẩu có ít nhất 8 ký tự, không yêu cầu ký tự đặc biệt
    return PasswordValidator.isStrong(password, {
      minLength: 8,
      requireUppercase: false,
      requireLowercase: false, 
      requireNumbers: false,
      requireSpecialChars: false,
      forbiddenWords: [],
      forbiddenPatterns: []
    });
  }

  defaultMessage(args: ValidationArguments) {
    const result = PasswordValidator.validate(args.value as string);
    return `Password is not strong enough: ${result.errors.join(", ")}`;
  }
}

// Custom validator for password confirmation
@ValidatorConstraint({ name: "isPasswordMatching", async: false })
export class IsPasswordMatchingConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const object = args.object as any;
    const password = object.password || object.newPassword;
    return password === confirmPassword;
  }

  defaultMessage() {
    return "Passwords do not match";
  }
}
