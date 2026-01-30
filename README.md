# Haryana Sepak Takraw Association (React + Vite)

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Build output goes to `dist/`.

## Deploy (GitHub Pages)

This app must be deployed as the built `dist/` output. If you configure GitHub Pages to serve the repository root, the browser will try to load source files like `/src/main.tsx` and you’ll get a blank page.

- Repo Settings → Pages → **Source: GitHub Actions**
- Push to `main` runs `.github/workflows/deploy.yml` and deploys `dist/`

### Base path

If your site is served under a subpath (example: `https://<user>.github.io/sports/`), make sure these match:

- `vite.config.ts`: `base: '/sports/'`
- `src/main.tsx`: `<BrowserRouter basename="/sports">`

If your repo name/path changes, update both accordingly.

### Common 404s in production

If you see these in DevTools:

- `Failed to load resource: /src/main.tsx (404)`

You are serving the **source** `index.html` (meant for `npm run dev`) instead of the built `dist/index.html`. Fix the hosting/deploy to publish `dist/`.

- `Failed to load resource: styles.css (404)`

Make sure the deployed site includes `dist/assets/css/styles.css` and that asset URLs are base-aware for `/sports/`.

### Tailwind CDN warning

The console warning about `cdn.tailwindcss.com` is expected because this project currently loads Tailwind via CDN (development-style). If you want to remove the warning and use Tailwind in production, migrate to Tailwind via PostCSS/Tailwind CLI.

---

Below is the original Vite template README.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
