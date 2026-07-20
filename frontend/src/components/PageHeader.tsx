import type { ReactNode } from "react";

// Arama kutusu için dışarıdan alacağımız özellikleri (props) tanımlıyoruz
interface PageHeaderProps {
  crumb: string;
  action?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function PageHeader({ crumb, action, searchValue, onSearchChange }: PageHeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
        {crumb}
      </div>
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Sistemde ara..."
          value={searchValue} // Kutudaki yazı
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)} // Yazı değiştikçe haber ver
          className="bg-foreground/5 border-none text-xs px-4 py-2 rounded-full w-64 focus:ring-1 focus:ring-accent outline-none"
        />
        {action}
      </div>
    </header>
  );
}

export function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between border-b border-foreground/10 pb-2">
      <h2 className="text-sm font-bold uppercase tracking-widest">{title}</h2>
      {right}
    </div>
  );
}
