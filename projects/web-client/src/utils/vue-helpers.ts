import { useI18n } from "vue-i18n";

/**
 * Create translation function with a fixed namespace.
 *
 * @example
 * const tp = createTranslationPrefixFn('extract-graphics')
 * tp('title')  // -> t('extract-graphics.title')
 */
export function createTranslationPrefixFn(scope: string) {
  const { t } = useI18n();

  return (key: string, params?: Record<string, unknown>) =>
    t(`${scope}.${key}`, params ?? {});
}
