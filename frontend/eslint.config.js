import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Controles de formulário e tabelas só pelos componentes de src/components/ui (mesmo padrão em todo o app)
const designSystemRules = [
  {
    selector: "JSXOpeningElement[name.name='select']",
    message: 'Use <Select> de components/ui em vez de <select>.',
  },
  {
    selector: "JSXOpeningElement[name.name='textarea']",
    message: 'Use <Textarea> de components/ui em vez de <textarea>.',
  },
  {
    selector: "JSXOpeningElement[name.name=/^(table|thead|tbody|tfoot|tr|th|td)$/]",
    message: 'Use <Table> de components/ui (alinhamento e espaçamento padrão de todas as tabelas).',
  },
  {
    selector:
      "JSXOpeningElement[name.name='input']:not(:has(JSXAttribute[name.name='type'][value.value=/^(checkbox|radio|file|hidden|range|color)$/]))",
    message: 'Use <Input> de components/ui em vez de <input> (só checkbox, radio, file, hidden, range e color ficam nativos).',
  },
]

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/components/ui/**'],
    rules: {
      'no-restricted-syntax': ['error', ...designSystemRules],
    },
  },
])
