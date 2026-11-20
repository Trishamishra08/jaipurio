/** An expected tool failure: the message is shown to Claude as is. */
class ToolError extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
  }
}

module.exports = { ToolError };
