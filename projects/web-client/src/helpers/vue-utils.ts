import { useI18n } from 'vue-i18n';

/**
 * Create translation function with a fixed namespace.
 *
 * @example
 * const translateInScope = createTranslationPrefixFn('extract-graphics')
 * translateInScope('title')  // -> translate('extract-graphics.title')
 */
export function createTranslationPrefixFn(scope: string) {
  const { t: translate } = useI18n();

  return (key: string, parameters?: Record<string, unknown>) => translate(`${scope}.${key}`, parameters ?? {});
}
