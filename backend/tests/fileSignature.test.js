const test = require('node:test');
const assert = require('node:assert');
const { realType } = require('../utils/fileSignature');

const pad = (head) => Buffer.concat([Buffer.from(head), Buffer.alloc(16)]);

test('real images, PDFs and videos are recognised by their bytes', () => {
  assert.strictEqual(realType(pad([0xff, 0xd8, 0xff, 0xe0])), 'jpg');
  assert.strictEqual(realType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'png');
  assert.strictEqual(realType(Buffer.concat([Buffer.from('RIFF\0\0\0\0WEBP'), Buffer.alloc(8)])), 'webp');
  assert.strictEqual(realType(pad([...Buffer.from('%PDF-1.7')])), 'pdf');
  assert.strictEqual(realType(Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypmp42'), Buffer.alloc(8)])), 'mp4');
});

test('scripts and markup renamed to images are refused', () => {
  assert.strictEqual(realType(pad([...Buffer.from('<?php system($_GET["c"]); ?>')])), null);
  assert.strictEqual(realType(pad([...Buffer.from('<svg onload="alert(1)">')])), null);
  assert.strictEqual(realType(pad([...Buffer.from('<html><script>x</script>')])), null);
  assert.strictEqual(realType(Buffer.from('tiny')), null);
});
