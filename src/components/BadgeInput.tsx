import { XMarkIcon } from '@heroicons/react/24/solid'; // Correct path for v2
import { Combobox, Transition } from '@headlessui/react';
import React, { useState, Fragment } from 'react';

interface BadgeInputProps {
  label: string;
  id: string;
  selectedItems: string[]; // Array of selected tech items (badges)
  availableChoices: string[]; // Predefined list of choices for autocomplete
  onAdd: (item: string) => void; // Function to add an item
  onRemove: (item: string) => void; // Function to remove an item
  placeholder?: string;
  labelClassName?: string;
  wrapperClassName?: string;
}

const BadgeInput: React.FC<BadgeInputProps> = ({
  label,
  id,
  selectedItems,
  availableChoices,
  onAdd,
  onRemove,
  placeholder = 'Type or select...',
  labelClassName = '',
  wrapperClassName = '',
}) => {
  const [query, setQuery] = useState('');

  const filteredChoices = query === ''
    ? availableChoices.filter(choice => !selectedItems.includes(choice)) // Show all available if no query
    : availableChoices.filter(choice =>
        !selectedItems.includes(choice) &&
        choice.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (item: string | null) => {
    if (item && !selectedItems.includes(item)) {
      onAdd(item);
    }
    setQuery(''); // Reset query after selection
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && query && !selectedItems.includes(query) && !availableChoices.includes(query)) {
      // Allow adding custom item on Enter if it's not already selected or in the predefined list
      event.preventDefault(); // Prevent form submission if needed
      onAdd(query);
      setQuery('');
    }
  };

  const defaultWrapperClasses = "mb-4";
  const defaultLabelClasses = "block text-sm font-medium text-slate-300 mb-2";
  const inputWrapperClasses = "relative mt-1";
  const inputClasses = "w-full rounded-md border border-slate-600 bg-slate-700 py-2 pl-3 pr-10 text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm";
  const badgeWrapperClasses = "flex flex-wrap gap-2 mt-2";
  const badgeClasses = "inline-flex items-center rounded-full bg-indigo-100/10 px-2.5 py-0.5 text-sm font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/20";
  const badgeRemoveButtonClasses = "ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-200/20 hover:text-indigo-300 focus:bg-indigo-500 focus:text-white focus:outline-none";
  const optionsWrapperClasses = "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm";
  const optionClasses = ({ active }: { active: boolean }) =>
    `relative cursor-default select-none py-2 px-4 ${active ? 'bg-indigo-600 text-white' : 'text-slate-200'}`;

  return (
    <div className={`${defaultWrapperClasses} ${wrapperClassName}`.trim()}>
      <Combobox value={null} onChange={handleSelect}> {/* Use null initially, selection triggers onChange */}
        <Combobox.Label className={`${defaultLabelClasses} ${labelClassName}`.trim()}>{label}</Combobox.Label>
        <div className={inputWrapperClasses}>
          <Combobox.Input
            className={inputClasses}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            displayValue={() => query} // Keep input value as the query
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
             {/* Optional: Add dropdown icon if needed */}
             {/* <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" /> */}
          </Combobox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className={optionsWrapperClasses}>
              {filteredChoices.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-400">
                  Nothing found.
                </div>
              ) : (
                filteredChoices.map((choice) => (
                  <Combobox.Option
                    key={choice}
                    className={optionClasses}
                    value={choice}
                  >
                    {choice}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>

      {/* Selected Items (Badges) */}
      {selectedItems.length > 0 && (
        <div className={badgeWrapperClasses}>
          {selectedItems.map((item) => (
            <span key={item} className={badgeClasses}>
              {item}
              <button
                type="button"
                className={badgeRemoveButtonClasses}
                onClick={() => onRemove(item)}
                aria-label={`Remove ${item}`}
              >
                <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default BadgeInput; 