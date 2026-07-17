import { translateRenderedText } from './translations';

export function localizeComplaintLetter({ letter, language, playerName, fallbackTitle = '', fallbackDescription = '' }) {
  const titleSource = letter?.title || fallbackTitle;
  const descriptionSource = letter?.description || fallbackDescription;
  const title = language === 'en' ? translateRenderedText(titleSource) : titleSource;
  const descriptionTemplate = language === 'en'
    ? translateRenderedText(descriptionSource)
    : descriptionSource;
  const description = String(descriptionTemplate || '')
    .replaceAll('[名字]', playerName || '')
    .replaceAll('[Name]', playerName || '');
  return { title, description };
}
