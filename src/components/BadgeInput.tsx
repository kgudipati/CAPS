import { XMarkIcon } from '@heroicons/react/24/solid'; // Correct path for v2
import { Combobox, Transition } from '@headlessui/react';
import React, { useState, Fragment, useRef, useEffect } from 'react';

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
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the actual input

  const filteredChoices = query === ''
    ? availableChoices.filter(choice => !selectedItems.includes(choice))
    : availableChoices.filter(choice =>
        !selectedItems.includes(choice) &&
        choice.toLowerCase().includes(query.toLowerCase())
      );

  // Combine filtered choices with a potential custom add option
  const optionsWithCustom = [
      ...filteredChoices,
      ...(query && !availableChoices.includes(query) && !selectedItems.includes(query) ? [`Add "${query}"`] : [])
  ];

  const handleSelect = (item: string | null) => {
    if (!item) return;

    // Check if it's the custom add option
    if (item.startsWith('Add "') && item.endsWith('"')) {
        const customItem = item.slice(5, -1);
        if (customItem && !selectedItems.includes(customItem)) {
            onAdd(customItem);
        }
    } else if (!selectedItems.includes(item)) {
      onAdd(item);
    }
    setQuery(''); // Reset query after selection or custom add
    // Optionally focus input after adding/selecting
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Backspace: Remove last badge if query is empty
    if (event.key === 'Backspace' && query === '' && selectedItems.length > 0) {
        onRemove(selectedItems[selectedItems.length - 1]);
        return; // Prevent default backspace behavior on the input itself
    }

    // Removed Enter key logic - Combobox onChange handles selection now
    // if (event.key === 'Enter' && ...) { ... }
  };

  const defaultWrapperClasses = "mb-4";
  const defaultLabelClasses = "block text-sm font-medium text-text-secondary mb-1.5"; // Adjusted margin

  // New wrapper acting as the input field area - Use theme colors
  const inputAreaWrapperClasses = `
    relative mt-1 flex flex-wrap items-center gap-2 p-2 min-h-[42px]
    w-full rounded-md border border-border bg-card {/* Use card background */}
    focus-within:border-accent focus-within:ring-1 focus-within:ring-accent
  `;

  // Input field itself (borderless, growing) - Use theme colors
  const inputClasses = `
    flex-grow p-0 border-none bg-transparent text-text-primary placeholder-text-secondary
    focus:ring-0 focus:outline-none sm:text-sm
  `;

  // Badge styling - Use theme accent colors
  // Adjusting badge appearance for better contrast/minimalism
  const badgeClasses = "inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-sm font-medium text-accent ring-1 ring-inset ring-accent/30";
  const badgeRemoveButtonClasses = "ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-accent/70 hover:bg-accent/20 hover:text-accent focus:bg-accent/30 focus:text-accent focus:outline-none";

  // Dropdown styling - Use theme colors
  const optionsWrapperClasses = "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-card border border-border py-1 text-base shadow-lg focus:outline-none sm:text-sm"; // Use card bg and border
  const optionClasses = ({ active }: { active: boolean }) =>
    `relative cursor-pointer select-none py-2 px-4 ${active ? 'bg-accent/80 text-background' : 'text-text-primary'}`;
  const customOptionClass = "italic text-accent hover:text-accent-hover"; // Style for the 'Add custom' option, adjust hover

  return (
    <div className={`${defaultWrapperClasses} ${wrapperClassName}`.trim()}>
      <Combobox value={null} onChange={handleSelect}>
        <Combobox.Label className={`${defaultLabelClasses} ${labelClassName}`.trim()}>{label}</Combobox.Label>

        {/* Input Area Wrapper */}
        <div className={inputAreaWrapperClasses}>
          {/* Selected Items (Badges) */}
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

          {/* Actual Input Field */}
          <Combobox.Input
            ref={inputRef}
            className={inputClasses}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={selectedItems.length === 0 ? placeholder : ''}
            displayValue={() => query}
          />
        </div>

        {/* Dropdown Options */}
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Combobox.Options className={optionsWrapperClasses}>
            {optionsWithCustom.length === 0 && query === '' ? (
                 <div className="relative cursor-default select-none py-2 px-4 text-text-secondary">
                   Start typing to search...
                 </div>
            ) : optionsWithCustom.length === 0 && query !== '' ? (
                 <div className="relative cursor-default select-none py-2 px-4 text-text-secondary">
                   Nothing found.
                 </div>
            ) : (
              optionsWithCustom.map((item) => (
                <Combobox.Option
                  key={item}
                  className={({ active }) =>
                      // Adjust custom option styling within the active state check
                      `${optionClasses({ active })} ${item.startsWith('Add "') && !active ? customOptionClass : ''} ${item.startsWith('Add "') && active ? 'italic' : ''}`
                  }
                  value={item}
                >
                  {({ selected, active }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                         {/* Display text, remove Add "" prefix for rendering */}
                         {item.startsWith('Add "') ? `Add "${item.slice(5, -1)}"` : item}
                      </span>
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </Combobox>
    </div>
  );
};

export default BadgeInput; 