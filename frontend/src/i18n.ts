import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import trTranslations from "./locales/tr.json";
import enTranslations from "./locales/en.json";

const resources = {
  tr: trTranslations,
  en: enTranslations,
};

const savedLanguage =
  typeof window !== "undefined" ? localStorage.getItem("i18nextLng") || "tr" : "tr";

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: savedLanguage, // default language
    fallbackLng: "tr",

    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
