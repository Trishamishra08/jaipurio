/** Every connector tool, in listing order. */
const content = require('./content');
const seo = require('./seo');
const ai = require('./ai');

const allTools = () => [...content.tools, ...seo.tools, ...ai.tools];

module.exports = { allTools };
