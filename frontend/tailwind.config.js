/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: colors.indigo,
                danger: colors.rose,
                safe: colors.emerald,
                warning: colors.amber,
                dark: {
                    800: colors.slate[800],
                    900: colors.slate[900],
                    950: colors.slate[950]
                },
                ink: {
                    dark: colors.slate[50],
                    muted: colors.slate[400]
                },
                surface: {
                    base0: colors.slate[800],
                    base1: colors.slate[700],
                },
                brand: {
                    sand: colors.stone[500],
                    orange: colors.orange[500],
                    teal: colors.teal[400],
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};

// Force Tailwind rebuild
