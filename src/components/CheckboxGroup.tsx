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
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  legend,
  options,
  selectedValues,
  onChange,
}) => {
  return (
    <fieldset className="mb-4">
      <legend className="block text-sm font-medium text-gray-700 mb-2">{legend}</legend>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center">
            <input
              id={option.id}
              name={option.id}
              type="checkbox"
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              checked={selectedValues.includes(option.id)} // Check if ID is in the selected array
              onChange={(e) => onChange(option.id, e.target.checked)}
            />
            <label htmlFor={option.id} className="ml-2 block text-sm text-gray-900">
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
};

export default CheckboxGroup;
