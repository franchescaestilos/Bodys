// Configuración de Tailwind CSS (debe cargarse después del script CDN de Tailwind)
tailwind.config = {
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#faf7f5',
                    100: '#f4ede6',
                    200: '#e8d9cc',
                    300: '#d7beaa',
                    400: '#c59f85',
                    500: '#b68366',
                    600: '#9d664c',
                    700: '#81503e',
                    800: '#6a4236',
                    900: '#57382e',
                    gold: '#c5a059',
                    rose: '#e8c5b8',
                    dark: '#121212',
                    lightGray: '#f8f8f8'
                }
            },
            fontFamily: {
                serif: ['"Cormorant Garamond"', 'serif'],
                sans: ['"Plus Jakarta Sans"', 'sans-serif']
            }
        }
    }
}
