import { createApp } from './app';
import { env } from './utils/env';

const app = createApp();

app.listen(env.PORT, () => {
  console.info(`API running on http://localhost:${env.PORT}`);
});
