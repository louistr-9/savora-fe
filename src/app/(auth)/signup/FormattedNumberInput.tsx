'use client';

import { useState } from 'react';

export default function FormattedNumberInput({
  name,
  defaultValue = 0,
  className,
}: {
  name: string;
  defaultValue?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(
    new Intl.NumberFormat('vi-VN').format(defaultValue)
  );
  const [rawValue, setRawValue] = useState(defaultValue.toString());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) {
      setDisplayValue('');
      setRawValue('0');
      return;
    }
    const num = parseInt(digits, 10);
    setDisplayValue(new Intl.NumberFormat('vi-VN').format(num));
    setRawValue(num.toString());
  };

  return (
    <>
      <input
        type="hidden"
        name={name}
        value={rawValue}
      />
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        className={className}
      />
    </>
  );
}

