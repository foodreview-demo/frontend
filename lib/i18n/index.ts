// i18n 인덱스 파일
export { ko, type TranslationKeys } from './ko'
export { en } from './en'

export type Locale = 'ko' | 'en'

export const locales: { code: Locale; name: string; nativeName: string }[] = [
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'en', name: 'English', nativeName: 'English' },
]

export const defaultLocale: Locale = 'ko'
