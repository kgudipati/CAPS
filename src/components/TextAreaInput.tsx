import React from 'react';

interface TextAreaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
  wrapperClassName?: string;
  labelClassName?: string;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({
  label,
  id,
  wrapperClassName = '',
  labelClassName = '',
  className = '',
  ...props
}) => {
  const defaultWrapperClasses = "mb-4";
  const defaultLabelClasses = "block text-sm font-medium text-text-secondary mb-1.5";
  const defaultInputClasses = `
    block w-full rounded-md shadow-sm sm:text-sm
    bg-card border-border placeholder-text-secondary text-text-primary
    focus:border-accent focus:ring-accent
  `;

  return (
    <div className={`${defaultWrapperClasses} ${wrapperClassName}`.trim()}>
      <label htmlFor={id} className={`${defaultLabelClasses} ${labelClassName}`.trim()}>
        {label}
        {props.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <textarea
        id={id}
        name={id}
        className={`${defaultInputClasses} ${className}`.trim()}
        {...props}
      />
    </div>
  );
};

export default TextAreaInput; 