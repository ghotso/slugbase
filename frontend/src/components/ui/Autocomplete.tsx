import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface AutocompleteOption {
  id: string;
  name: string;
}

interface AutocompleteProps {
  value: AutocompleteOption[];
  onChange: (value: AutocompleteOption[]) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  onCreateNew?: (name: string) => Promise<AutocompleteOption | null>;
  className?: string;
}

export default function Autocomplete({
  value,
  onChange,
  options,
  placeholder = 'Type to search...',
  onCreateNew,
  className = '',
}: AutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = options.filter(
        (opt) =>
          !value.find((v) => v.id === opt.id) &&
          opt.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
      setIsOpen(Boolean(filtered.length > 0 || (onCreateNew !== undefined && inputValue.trim().length > 0)));
    } else {
      setFilteredOptions([]);
      setIsOpen(false);
    }
  }, [inputValue, options, value, onCreateNew]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen === true) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (option: AutocompleteOption) => {
    onChange([...value, option]);
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (id: string) => {
    onChange(value.filter((v) => v.id !== id));
  };

  const handleCreateNew = async () => {
    if (onCreateNew && inputValue.trim()) {
      const newOption = await onCreateNew(inputValue.trim());
      if (newOption) {
        handleSelect(newOption);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isOpen && filteredOptions.length > 0) {
      e.preventDefault();
      handleSelect(filteredOptions[0]);
    } else if (e.key === 'Enter' && onCreateNew && inputValue.trim()) {
      e.preventDefault();
      handleCreateNew();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selected items */}
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm font-medium text-blue-800 dark:text-blue-200"
            >
              {item.name}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => inputValue.trim() && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      />

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg max-h-60 overflow-auto">
            {filteredOptions.length === 0 && onCreateNew && inputValue.trim() ? (
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Create "{inputValue.trim()}"
              </button>
            ) : filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {option.name}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
