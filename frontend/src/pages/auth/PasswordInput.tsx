import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const PasswordInput = ({
  value,
  onChange,
  placeholder = "••••••••",
}: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border border-border rounded-lg bg-surface-muted focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition">
      <Lock size={18} className="text-text-muted shrink-0" />
      <input
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="text-text-muted hover:text-text-secondary transition-colors shrink-0"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default PasswordInput;
