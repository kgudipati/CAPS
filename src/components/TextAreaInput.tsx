import React from 'react';

interface TextAreaInputProps {
  label: string;
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  wrapperClassName?: string;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({
  label,
  id,
  value,
  onChange,
  placeholder = '',
  rows = 4,
  required = false,
  className = '',
  labelClassName = '',
  wrapperClassName = ''
}) => {
  const defaultWrapperClasses = "mb-4";
  const defaultLabelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const defaultTextAreaClasses = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <div className={`${defaultWrapperClasses} ${wrapperClassName}`.trim()}>
      <label htmlFor={id} className={`${defaultLabelClasses} ${labelClassName}`.trim()}>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        className={`${defaultTextAreaClasses} ${className}`.trim()}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
};

export default TextAreaInput; 