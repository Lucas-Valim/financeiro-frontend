import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Vite Configuration', () => {
  it('should have react-big-calendar in package.json dependencies', () => {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
    )
    expect(packageJson.dependencies).toHaveProperty('react-big-calendar')
  })

  it('should have terser as devDependency for minification', () => {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
    )
    expect(packageJson.devDependencies).toHaveProperty('terser')
  })

  it('should have code splitting configuration with manualChunks', () => {
    const viteConfig = readFileSync(join(process.cwd(), 'vite.config.js'), 'utf-8')
    
    expect(viteConfig).toContain('manualChunks')
    expect(viteConfig).toContain('vendor')
    expect(viteConfig).toContain('router')
    expect(viteConfig).toContain('query')
    expect(viteConfig).toContain('calendar')
  })

  it('should have target esnext for modern browsers', () => {
    const viteConfig = readFileSync(join(process.cwd(), 'vite.config.js'), 'utf-8')
    expect(viteConfig).toContain("target: 'esnext'")
  })

  it('should have terser minification configured', () => {
    const viteConfig = readFileSync(join(process.cwd(), 'vite.config.js'), 'utf-8')
    expect(viteConfig).toContain("minify: 'terser'")
  })
})
