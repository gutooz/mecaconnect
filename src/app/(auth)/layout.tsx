export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen gradient-mesh relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
