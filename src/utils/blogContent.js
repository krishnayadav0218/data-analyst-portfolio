// Converts between the structured content-block format used by BlogDetail.jsx
// ([{ type: 'heading' | 'paragraph' | 'list', ... }]) and a simple, writer-friendly
// plain text format for the admin textarea:
//
//   ## This becomes a heading
//   A plain line (or several) becomes a paragraph.
//   - This becomes
//   - a bullet list
//
// Blocks/lines are separated by blank lines.

export function blocksToText(blocks) {
  return (blocks || [])
    .map((block) => {
      if (block.type === 'heading') return `## ${block.text}`;
      if (block.type === 'list') return (block.items || []).map((item) => `- ${item}`).join('\n');
      return block.text || '';
    })
    .filter(Boolean)
    .join('\n\n');
}

export function textToBlocks(text) {
  const lines = (text || '').split('\n');
  const blocks = [];
  let paragraphBuffer = [];
  let listBuffer = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length) {
      blocks.push({ type: 'paragraph', text: paragraphBuffer.join(' ').trim() });
      paragraphBuffer = [];
    }
  };
  const flushList = () => {
    if (listBuffer.length) {
      blocks.push({ type: 'list', items: listBuffer });
      listBuffer = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', text: line.slice(3).trim() });
    } else if (line.startsWith('- ')) {
      flushParagraph();
      listBuffer.push(line.slice(2).trim());
    } else {
      flushList();
      paragraphBuffer.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}
