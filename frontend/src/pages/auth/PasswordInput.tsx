import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { IconButton, Input } from "../../components/ui";

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

// Campo de senha sobre o Input padrão, com botão de mostrar/ocultar à direita
const PasswordInput = ({
  value,
  onChange,
  placeholder = "••••••••",
}: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      type={visible ? "text" : "password"}
      icon={Lock}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      suffix={
        <IconButton
          icon={visible ? EyeOff : Eye}
          label={visible ? "Ocultar senha" : "Mostrar senha"}
          size="sm"
          className="-mr-2"
          onClick={() => setVisible((prev) => !prev)}
        />
      }
    />
  );
};

export default PasswordInput;
