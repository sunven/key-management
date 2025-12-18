import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import {
  type Locale,
  locales,
  defaultLocale,
  LOCALE_COOKIE_NAME,
} from '@/lib/i18n-config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale: Locale =
    localeCookie && locales.includes(localeCookie as Locale)
      ? (localeCookie as Locale)
      : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
