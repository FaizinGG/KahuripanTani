import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  autoComplete,
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`w-full pr-12 ${className}`}
      />

      <button
        type="button"
        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
        title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
        onClick={() => setShowPassword((prev) => !prev)}
        disabled={disabled}
        className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-500 transition hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
      >
        {showPassword ? (
          <EyeOff className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Eye className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
