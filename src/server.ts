const dotenv = require("dotenv");
dotenv.config();

const app = require("./app").default;
const { ensureAuth } = require("./utils/directusClient");

const port = Number(process.env.PORT) || 4000;

async function start() {
  await ensureAuth();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${port}`);
  });
}

start();
