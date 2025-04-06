import React from 'react';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

export interface Category {
  id: number;
  name: string;
  type: 'A' | 'B' | 'C' | 'D';
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategories: Category[];
  onChange: (categories: Category[]) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategories,
  onChange,
}) => {
  const handleChange = (newSelection: Category[]) => {
    // Ensure at least one category is selected
    if (newSelection.length === 0) {
      return;
    }
    onChange(newSelection);
  };

  return (
    <Listbox value={selectedCategories} onChange={handleChange} multiple>
      <div className="relative mt-1">
        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-300 sm:text-sm">
          <span className="block truncate">
            {selectedCategories.length === 0
              ? 'Select at least one category'
              : `${selectedCategories.length} categories selected`}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
          {categories.map((category) => (
            <Listbox.Option
              key={category.id}
              className={({ active }) =>
                `relative cursor-default select-none py-2 pl-10 pr-4 ${
                  active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'
                }`
              }
              value={category}
            >
              {({ selected, active }) => (
                <>
                  <span
                    className={`block truncate ${
                      selected ? 'font-medium' : 'font-normal'
                    }`}
                  >
                    {category.name} ({category.type})
                  </span>
                  {selected ? (
                    <span
                      className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                        active ? 'text-primary-600' : 'text-primary-600'
                      }`}
                    >
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  ) : null}
                </>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  );
};

export default CategorySelector; 