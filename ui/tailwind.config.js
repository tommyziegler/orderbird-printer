import { heroui } from '@heroui/react'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: '#f4f5f7',
            foreground: '#1a1f36',
            divider:    '#e2e8f0',
            primary: {
              50:      '#e6f0fc',
              100:     '#cce1f9',
              200:     '#99c4f3',
              300:     '#66a6ed',
              400:     '#3389e7',
              500:     '#006cc1',  // Cisco-like blue
              600:     '#0057a0',
              700:     '#004280',
              800:     '#002d60',
              900:     '#001840',
              DEFAULT: '#006cc1',
              foreground: '#ffffff',
            },
            secondary: {
              DEFAULT: '#64748b',
              foreground: '#ffffff',
            },
            success: {
              DEFAULT: '#17a34a',
              foreground: '#ffffff',
            },
            warning: {
              DEFAULT: '#d97706',
              foreground: '#ffffff',
            },
            danger: {
              DEFAULT: '#dc2626',
              foreground: '#ffffff',
            },
          },
        },
        dark: {
          colors: {
            background: '#0d1117',
            foreground: '#e6edf3',
            divider:    '#21262d',
            primary: {
              50:      '#001d3d',
              100:     '#003566',
              200:     '#023e8a',
              300:     '#0353a4',
              400:     '#0466c8',
              500:     '#0582e1',
              600:     '#4fa3f7',
              700:     '#90c5ff',
              800:     '#bdd7ff',
              900:     '#deeaff',
              DEFAULT: '#4fa3f7',
              foreground: '#000000',
            },
            secondary: {
              DEFAULT: '#8b949e',
              foreground: '#0d1117',
            },
            success: {
              DEFAULT: '#3fb950',
              foreground: '#000000',
            },
            warning: {
              DEFAULT: '#d29922',
              foreground: '#000000',
            },
            danger: {
              DEFAULT: '#f85149',
              foreground: '#ffffff',
            },
          },
        },
      },
    }),
  ],
}
