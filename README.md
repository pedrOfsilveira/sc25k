# C25K (c25k)

A couch to 5k retro style app.

## Environment

Create a `.env` file with:

```dotenv
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
VITE_APP_URL=http://localhost:9000
```

For Vercel, set `VITE_APP_URL` to your production domain (for example `https://your-app.vercel.app`).

## Install the dependencies
```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```


### Build the app for production
```bash
quasar build
```

### Customize the configuration
See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
