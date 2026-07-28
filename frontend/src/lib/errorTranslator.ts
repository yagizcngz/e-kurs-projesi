import type { TFunction } from "i18next";

export const translateBackendError = (errText: string, t: TFunction): string => {
  if (!errText) return "";

  const lower = errText.toLowerCase();

  if (lower.includes("bu e-posta adresi zaten kullanımda")) {
    return t("backendErrors.emailInUse", "This email address is already in use.");
  }
  if (lower.includes("bu kullanıcı adı zaten alınmış")) {
    return t("backendErrors.usernameInUse", "This username is already taken.");
  }
  if (lower.includes("öğrenci bu kursa zaten kayıtlı")) {
    return t("backendErrors.studentAlreadyEnrolled", "Student is already enrolled in this course.");
  }
  if (lower.includes("bu öğrenci numarası sistemde zaten kayıtlı")) {
    return t("backendErrors.studentNumberInUse", "This student number is already registered.");
  }
  if (lower.includes("gerekli") || lower.includes("zorunlu")) {
    return t("backendErrors.fieldsRequired", "Please fill in all required fields.");
  }

  // Return the original text if no match found
  return errText;
};
