import React from 'react';

interface CheckboxOption {
  id: string;
  label: string;
}

interface CheckboxGroupProps {
  legend?: string;
  options: { id: string; label: string }[];
  selectedValues: string[];
  onChange: (id: string, checked: boolean) => void;
  fieldsetClassName?: string;
  legendClassName?: string;
  checkboxWrapperClassName?: string;
  checkboxClassName?: string;
  labelClassName?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  legend,
  options,
  selectedValues,
  onChange,
  fieldsetClassName = '',
  legendClassName = '',
  checkboxWrapperClassName = '',
  checkboxClassName = '',
  labelClassName = '',
}) => {
  const defaultFieldsetClasses = "border-none p-0 m-0"; // Basic reset
  const defaultLegendClasses = "block text-sm font-medium text-text-secondary mb-3"; // Theme color
  const defaultCheckboxWrapperClasses = "flex items-center";
  // Theme colors, remove ring
  const defaultCheckboxClasses = "h-4 w-4 rounded border-border bg-card text-accent focus:ring-accent focus:ring-offset-card";
  const defaultLabelClasses = "ml-2 block text-sm text-text-primary"; // Theme color

  return (
    <fieldset className={`${defaultFieldsetClasses} ${fieldsetClassName}`.trim()}>
      {legend && <legend className={`${defaultLegendClasses} ${legendClassName}`.trim()}>{legend}</legend>}
      <div className="space-y-3"> {/* Adjust spacing as needed */}
        {options.map((option) => (
          <div key={option.id} className={`${defaultCheckboxWrapperClasses} ${checkboxWrapperClassName}`.trim()}>
            <input
              id={option.id}
              name={option.id}
              type="checkbox"
              checked={selectedValues.includes(option.id)}
              onChange={(e) => onChange(option.id, e.target.checked)}
              className={`${defaultCheckboxClasses} ${checkboxClassName}`.trim()}
            />
            <label htmlFor={option.id} className={`${defaultLabelClasses} ${labelClassName}`.trim()}>
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
};

export default CheckboxGroup;
