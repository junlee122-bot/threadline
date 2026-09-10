export const LOCALES = ["en", "ko"] as const;

export type Locale = (typeof LOCALES)[number];
export type MessageValues = Record<string, string | number>;
export type MessageCatalog = Record<string, string>;

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "ko";
}

export function formatMessage(template: string, values?: MessageValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (token, key: string) => String(values[key] ?? token));
}
