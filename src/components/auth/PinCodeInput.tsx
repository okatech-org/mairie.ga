import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PinCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function PinCodeInput({ value, onChange, disabled, className }: PinCodeInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Sync external value to internal digits
    const newDigits = value.split('').slice(0, 6);
    while (newDigits.length < 6) newDigits.push('');
    setDigits(newDigits);
  }, [value]);

  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    const digit = newValue.replace(/\D/g, '').slice(-1);
    
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    
    // Update parent
    onChange(newDigits.join(''));
    
    // Move to next input if digit entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = pastedData.split('');
    while (newDigits.length < 6) newDigits.push('');
    setDigits(newDigits);
    onChange(newDigits.join(''));
    
    // Focus last filled input
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    if (lastFilledIndex >= 0) {
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-12 h-14 text-center text-2xl font-bold",
            "focus:ring-2 focus:ring-primary focus:border-primary",
            digit && "bg-primary/5 border-primary"
          )}
        />
      ))}
    </div>
  );
}
