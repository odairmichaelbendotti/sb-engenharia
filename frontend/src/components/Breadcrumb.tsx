import { ChevronRight } from "lucide-react";

const Breadcrumb = ({ current }: { current: string }) => {
  return (
    <nav className="mb-6" aria-label="Navegação">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <a href="/" className="hover:text-text-primary transition-colors">
          Início
        </a>
        <ChevronRight size={14} className="text-border-strong" />
        <span className="flex items-center gap-2 text-text-primary font-semibold">
          <span className="w-2 h-2 rounded-full bg-primary-500" />
          {current}
        </span>
      </div>
    </nav>
  );
};

export default Breadcrumb;
