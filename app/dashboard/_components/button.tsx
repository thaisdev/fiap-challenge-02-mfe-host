type ButtonProps = {
  children: React.ReactNode;
  styleType?: "primary" | "secondary";
  onClick?: () => void;
  className?: string; // permite adicionar classes extras se precisar
};

export function Button({
  children,
  styleType = "primary",
  onClick,
  className = "",
}: ButtonProps) {
  const baseClasses =
    "w-full lg:w-auto rounded px-4 py-3 font-semibold transition-transform hover:scale-105";

  const styles = {
    primary: "bg-orange-500 text-white", // Configurar / Voltar
    secondary: "border border-red-500 text-red-500", // Bloquear
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${styles[styleType]} ${className}`}
    >
      {children}
    </button>
  );
}
