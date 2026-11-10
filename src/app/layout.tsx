import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carrito Take-Away | SaaS para Carritos de Comida & Food Trucks",
  description: "Plataforma SaaS para cartas digitales QR interactivas, comandería táctil KDS en tiempo real y cobros con Mercado Pago.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
