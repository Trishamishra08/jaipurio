import React from 'react';
import AdSlot from './AdSlot';

const SHORTCODE_RE = /\[ads\s+key=["']([^"']+)["']\]\[\/ads\]/g;

/**
 * Renders CMS-authored HTML (blog posts, pages) while replacing any
 * `[ads key="XXX"][/ads]` shortcode with a live AdSlot — the same shortcode
 * format shown in the admin Ads list for pasting into content.
 */
const ContentWithAds = ({ html = '', className, as: Wrapper = 'div' }) => {
  const parts = [];
  let lastIndex = 0;
  let match;
  SHORTCODE_RE.lastIndex = 0;

  while ((match = SHORTCODE_RE.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'html', value: html.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'ad', code: match[1] });
    lastIndex = SHORTCODE_RE.lastIndex;
  }
  if (lastIndex < html.length) {
    parts.push({ type: 'html', value: html.slice(lastIndex) });
  }

  if (parts.length <= 1 && parts[0]?.type !== 'ad') {
    return <Wrapper className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <Wrapper className={className}>
      {parts.map((part, i) =>
        part.type === 'ad' ? (
          <AdSlot key={`ad-${i}`} code={part.code} />
        ) : (
          <span key={`html-${i}`} dangerouslySetInnerHTML={{ __html: part.value }} />
        )
      )}
    </Wrapper>
  );
};

export default ContentWithAds;
