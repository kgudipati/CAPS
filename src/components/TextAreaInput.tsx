import React from 'react';

interface TextAreaInputProps {
  label: string;
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({
  label,
  id,
  value,
  onChange,
  placeholder = '',
  rows = 4,
  required = false,
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
};

export default TextAreaInput; 