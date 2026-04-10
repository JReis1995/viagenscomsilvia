export default function ContaRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-sand text-ocean-900 antialiased">
      {children}
    </div>
  );
}
