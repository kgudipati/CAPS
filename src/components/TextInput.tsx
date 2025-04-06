import React from 'react';

interface TextInputProps {
  label: string;
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  inputClassName?: string;
  labelClassName?: string;
  wrapperClassName?: string;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  id,
  value,
  onChange,
  placeholder = '',
  required = false,
  type = 'text',
  inputClassName = '',
  labelClassName = '',
  wrapperClassName = ''
}) => {
  const defaultWrapperClasses = "mb-4";
  const defaultLabelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const defaultInputClasses = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <div className={`${defaultWrapperClasses} ${wrapperClassName}`.trim()}>
      <label htmlFor={id} className={`${defaultLabelClasses} ${labelClassName}`.trim()}>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        className={`${defaultInputClasses} ${inputClassName}`.trim()}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
};

export default TextInput;
