import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Padrão legítimo no projeto (fetch assíncrono, init de estado por API do browser).
      // Regra do React Compiler — não usamos o compiler neste app.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
