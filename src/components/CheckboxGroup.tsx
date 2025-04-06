import React from 'react';

interface CheckboxOption {
  id: string;
  label: string;
}

interface CheckboxGroupProps {
  legend: string;
  options: CheckboxOption[];
  selectedValues: string[]; // Use string array for simple cases
  onChange: (optionId: string, isChecked: boolean) => void;
  fieldsetClassName?: string; // Class for the fieldset element
  legendClassName?: string;   // Class for the legend element
  labelClassName?: string;    // Class for the individual label elements
  checkboxClassName?: string; // Class for the individual input (checkbox) elements
  itemWrapperClassName?: string; // Class for the div wrapping each checkbox+label
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  legend,
  options,
  selectedValues,
  onChange,
  fieldsetClassName = '',
  legendClassName = '',
  labelClassName = '',
  checkboxClassName = '',
  itemWrapperClassName = ''
}) => {
  // Combine default styles with passed-in classes
  const defaultFieldsetClasses = "mb-4";
  const defaultLegendClasses = "block text-sm font-medium text-gray-700 mb-2";
  const defaultItemWrapperClasses = "flex items-center";
  const defaultCheckboxClasses = "h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500";
  const defaultLabelClasses = "ml-2 block text-sm text-gray-900";

  return (
    <fieldset className={`${defaultFieldsetClasses} ${fieldsetClassName}`.trim()}>
      <legend className={`${defaultLegendClasses} ${legendClassName}`.trim()}>{legend}</legend>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.id} className={`${defaultItemWrapperClasses} ${itemWrapperClassName}`.trim()}>
            <input
              id={option.id}
              name={option.id}
              type="checkbox"
              className={`${defaultCheckboxClasses} ${checkboxClassName}`.trim()} // Apply combined checkbox classes
              checked={selectedValues.includes(option.id)} // Check if ID is in the selected array
              onChange={(e) => onChange(option.id, e.target.checked)}
            />
            <label htmlFor={option.id} className={`${defaultLabelClasses} ${labelClassName}`.trim()}> {/* Apply combined label classes */}
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
};

export default CheckboxGroup;
