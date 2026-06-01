import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

function getBasePath() {
  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]

  if (process.env.GITHUB_PAGES !== 'true' || !repositoryName) {
    return '/'
  }

  if (repositoryName.endsWith('.github.io')) {
    return '/'
  }

  return `/${repositoryName}/`
}

// https://vite.dev/config/
export default defineConfig({
  base: getBasePath(),
  plugins: [react()],
})
