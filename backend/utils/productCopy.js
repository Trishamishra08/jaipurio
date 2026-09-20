/** Shared rich description/content builders for catalog seed + stubs. */

const isStubHtml = (html) => {
  const plain = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return !plain || plain.length < 180;
};

const buildDescriptionHtml = (productName = 'Jaipurio handmade piece') =>
  `<p><strong>Ready to bring authentic Jaipur craftsmanship home?</strong> Our ${productName} is handcrafted for everyday beauty and lasting heritage.</p>
<p><strong>What You'll Receive:</strong></p>
<ul>
<li>Genuine artisan-made piece from Jaipur</li>
<li>Premium mitti / marble craftsmanship</li>
<li>Thoughtful design for home and ritual use</li>
<li>Secure packaging with care guidance</li>
<li>Trusted by families who choose handmade over factory ware</li>
</ul>`;

const buildContentHtml = (productName = 'Jaipurio handmade piece') =>
  `<p>Elevate your space with our ${productName}. Each piece is finished by hand so small variations in tone and texture are a mark of authenticity — not factory moulds.</p>
<h3>Why families choose Jaipurio</h3>
<p><strong>Mass-produced décor fades fast.</strong> Our artisans work with traditional methods so your piece stays beautiful for years of daily use, gifting, and festive rituals.</p>
<figure class="table">
<table>
<thead><tr><th>Detail</th><th>What you get</th><th>Why it matters</th></tr></thead>
<tbody>
<tr><td>Origin</td><td>Jaipur artisan workshops</td><td>Real heritage craft</td></tr>
<tr><td>Make</td><td>Handmade finish</td><td>Unique character in every piece</td></tr>
<tr><td>Use</td><td>Home, puja and gifting</td><td>Beauty with purpose</td></tr>
<tr><td>Care</td><td>Simple dry / soft-cloth clean</td><td>Easy everyday maintenance</td></tr>
</tbody>
</table>
</figure>
<h3>A note from the workshop</h3>
<p><strong>Result:</strong> When you choose ${productName} from Jaipurio, you support living craft traditions and bring a piece of Rajasthan into your home.</p>`;

const ensureRichCopy = (name, description, content) => {
  const productName = name || 'Jaipurio handmade piece';
  let nextDescription = isStubHtml(description)
    ? buildDescriptionHtml(productName)
    : description;
  let nextContent = isStubHtml(content)
    ? isStubHtml(description)
      ? buildContentHtml(productName)
      : description
    : content;
  // Old serializers sometimes copied content into both fields — restore distinct copy
  if (nextDescription && nextContent && nextDescription === nextContent) {
    nextDescription = buildDescriptionHtml(productName);
    nextContent = buildContentHtml(productName);
  }
  return { description: nextDescription, content: nextContent };
};

module.exports = {
  isStubHtml,
  buildDescriptionHtml,
  buildContentHtml,
  ensureRichCopy,
};
