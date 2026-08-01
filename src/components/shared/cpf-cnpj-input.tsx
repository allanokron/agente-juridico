import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CpfCnpjInputProps {
  tipo: "CPF" | "CNPJ"
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  label?: string
}

const MAX_LENGTH = {
  CPF: 14,
  CNPJ: 18,
}

function applyMask(value: string, tipo: "CPF" | "CNPJ"): string {
  const digits = value.replace(/\D/g, "").slice(0, tipo === "CPF" ? 11 : 14)

  if (tipo === "CPF") {
    const d = digits
    let masked = ""
    for (let i = 0; i < d.length; i++) {
      if (i === 3 || i === 6) masked += "."
      if (i === 9) masked += "-"
      masked += d[i]
    }
    return masked
  }

  const d = digits
  let masked = ""
  for (let i = 0; i < d.length; i++) {
    if (i === 2 || i === 5) masked += "."
    if (i === 8) masked += "/"
    if (i === 12) masked += "-"
    masked += d[i]
  }
  return masked
}

export function CpfCnpjInput({
  tipo,
  value,
  onChange,
  disabled,
  placeholder,
  label,
}: CpfCnpjInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value, tipo)
    if (masked.length <= MAX_LENGTH[tipo]) {
      onChange(masked)
    }
  }

  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      <Input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder ?? (tipo === "CPF" ? "000.000.000-00" : "00.000.000/0000-00")}
        maxLength={MAX_LENGTH[tipo]}
      />
    </div>
  )
}
