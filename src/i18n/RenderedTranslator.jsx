import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLanguage } from './LanguageContext';
import { translateRenderedText } from './translations';

const originalText = new WeakMap();
const translatedAttributes = ['placeholder', 'title', 'aria-label', 'alt'];
const containsChinese = value => /[\u3400-\u9fff]/.test(value || '');

function shouldSkip(node) {
  const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  return Boolean(element?.closest?.('[data-i18n-skip]'));
}

function sourceForTextNode(node, refreshSource) {
  const current = node.nodeValue;
  if (!originalText.has(node)) {
    originalText.set(node, current);
  } else if (refreshSource) {
    const previous = originalText.get(node);
    // React may update a node while English is active. Keep the real Chinese
    // source instead of accidentally promoting our English output to source.
    if (containsChinese(current) || !containsChinese(previous)) {
      originalText.set(node, current);
    }
  }
  return originalText.get(node);
}

function sourceForAttribute(node, attribute) {
  const key = `data-i18n-original-${attribute}`;
  const current = node.getAttribute(attribute);
  if (!node.hasAttribute(key)) {
    node.setAttribute(key, current);
  } else {
    const previous = node.getAttribute(key);
    if (containsChinese(current) || !containsChinese(previous)) {
      node.setAttribute(key, current);
    }
  }
  return node.getAttribute(key);
}

function visit(root, language, refreshSource = false) {
  if (!root) return;
  const nodes = root.nodeType === Node.TEXT_NODE
    ? [root]
    : [
        ...(root.nodeType === Node.ELEMENT_NODE ? [root] : []),
        ...(root.querySelectorAll ? root.querySelectorAll('*') : [])
      ];

  for (const node of nodes) {
    if (shouldSkip(node)) continue;
    if (node.nodeType === Node.TEXT_NODE) {
      const source = sourceForTextNode(node, refreshSource);
      node.nodeValue = language === 'en'
        ? translateRenderedText(source)
        : source;
      continue;
    }

    for (const child of node.childNodes) {
      if (child.nodeType !== Node.TEXT_NODE) continue;
      if (shouldSkip(child)) continue;
      const source = sourceForTextNode(child, refreshSource);
      child.nodeValue = language === 'en'
        ? translateRenderedText(source)
        : source;
    }

    for (const attribute of translatedAttributes) {
      if (!node.hasAttribute?.(attribute)) continue;
      const source = sourceForAttribute(node, attribute);
      node.setAttribute(attribute, language === 'en' ? translateRenderedText(source) : source);
    }
  }
}

export default function RenderedTranslator() {
  const { language } = useLanguage();
  const languageRef = useRef(language);

  useLayoutEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    visit(document.body, language);
    const observer = new MutationObserver(records => {
      observer.disconnect();
      const activeLanguage = languageRef.current;
      for (const record of records) {
        // React reuses text nodes for counters and match commentary. Treat a
        // character-data mutation as a new Chinese source value.
        if (record.type === 'characterData') visit(record.target, activeLanguage, true);
        for (const node of record.addedNodes) visit(node, activeLanguage);
      }
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [language]);

  return null;
}
