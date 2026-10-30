export const metadata = {
  title: 'Desa Pego',
  description: 'Brechó online comunitário',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
