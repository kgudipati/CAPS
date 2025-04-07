import React from 'react';

interface TextAreaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
  labelClassName?: string;
  wrapperClassName?: string;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({
  label,
  id,
  labelClassName = '',
  wrapperClassName = '',
  className = '',
  ...props
}) => {
  const defaultWrapperClasses = "mb-4";
  const defaultLabelClasses = "block text-sm font-medium text-neutral-300 mb-2";
  const defaultInputClasses =
    "block w-full rounded-md shadow-sm border-neutral-600 bg-neutral-700 placeholder-neutral-400 text-neutral-100 focus:border-teal-500 focus:ring-teal-500 sm:text-sm";

  return (
    <div className={`${defaultWrapperClasses} ${wrapperClassName}`.trim()}>
      <label htmlFor={id} className={`${defaultLabelClasses} ${labelClassName}`.trim()}>
        {label}
      </label>
      <div className="mt-1">
        <textarea
          id={id}
          name={id}
          rows={4}
          className={`${defaultInputClasses} ${className}`.trim()}
          {...props}
        />
      </div>
    </div>
  );
};

export default TextAreaInput; 