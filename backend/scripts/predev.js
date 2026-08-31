require('dotenv').config({ quiet: true });
const { freePort } = require('./free-port');

const port = process.env.PORT || 5000;
if (freePort(port)) {
  console.log(`Freed port ${port} from a previous backend run.`);
}
