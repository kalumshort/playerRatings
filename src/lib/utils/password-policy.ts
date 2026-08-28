/**
 * Single source of truth for password strength.
 *
 * Previously each surface invented its own rules: the social "add password"
 * modal demanded 8 chars + number + symbol + mixed case, the change-password
 * modal only checked length, and signup had no client-side check at all. A
 * Google user adding a password therefore faced stricter rules than someone
 * creating an account from scratch. Anywhere a user *chooses* a password now
 * goes through here — relax the rules in one place if that proves too strict.
 */

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULE_SUMMARY =
  "Minimum 8 characters, number, symbol, mixed case";

export interface PasswordChecks {
  length: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  hasMixedCase: boolean;
}

export function checkPassword(password: string): PasswordChecks {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/'`~;]/.test(password),
    hasMixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
  };
}

export function isPasswordStrong(password: string): boolean {
  const checks = checkPassword(password);
  return (
    checks.length && checks.hasNumber && checks.hasSpecial && checks.hasMixedCase
  );
}

/**
 * Helper text for a password field. Returns the neutral rule summary before
 * the user types, then narrows to whatever is still missing.
 */
export function getPasswordHelperText(password: string): string {
  if (!password) return PASSWORD_RULE_SUMMARY;
  if (isPasswordStrong(password)) return "Strong password!";
  if (!checkPassword(password).length) {
    return `At least ${PASSWORD_MIN_LENGTH} characters required`;
  }
  return "Include numbers, symbols, uppercase & lowercase letters";
}
