export function Footer() {
  return (
    <footer className="mt-16 border-t border-line py-8 text-center font-mono text-xs text-muted">
      <div className="container mx-auto px-4">
        <p className="mb-2">Where every page speaks to your soul</p>
        <p className="text-[10px] opacity-60">
          Built with ❤️ by Kartik Yadav Gurve
        </p>
        <p className="text-[10px] opacity-40 mt-1">
          © {new Date().getFullYear()} SoulPages. All rights reserved.
        </p>
      </div>
    </footer>
  );
}