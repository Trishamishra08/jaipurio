/** Every connector tool, in listing order. */
const content = require('./content');
const seo = require('./seo');

const allTools = () => [...content.tools, ...seo.tools];

module.exports = { allTools };
