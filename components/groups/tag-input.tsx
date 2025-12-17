'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  suggestions?: string[];
  onFetchSuggestions?: () => void;
}

export function TagInput({
  value,
  onChange,
  placeholder = 'Add tag...',
  maxTags = 20,
  disabled = false,
  suggestions = [],
  onFetchSuggestions,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input and exclude already selected tags
  const filteredSuggestions = suggestions.filter(
    (tag) =>
      !value.includes(tag) &&
      tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Fetch suggestions when component mounts or gets focus
  useEffect(() => {
    if (onFetchSuggestions && suggestions.length === 0) {
      onFetchSuggestions();
    }
  }, [onFetchSuggestions, suggestions.length]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag]);
    }
    setInputValue('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        return;
      }
      if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        addTag(filteredSuggestions[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedIndex(-1);
        return;
      }
    }

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // If user types a comma, add the tag immediately
    if (newValue.includes(',')) {
      const parts = newValue.split(',');
      parts.forEach((part, index) => {
        if (index < parts.length - 1) {
          addTag(part);
        } else {
          setInputValue(part);
        }
      });
    } else {
      setInputValue(newValue);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    }
  };

  const handleFocus = () => {
    setShowSuggestions(true);
    if (onFetchSuggestions) {
      onFetchSuggestions();
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow click events on suggestions
    setTimeout(() => {
      if (
        !suggestionsRef.current?.contains(document.activeElement) &&
        document.activeElement !== inputRef.current
      ) {
        setShowSuggestions(false);
        if (inputValue.trim()) {
          addTag(inputValue);
        }
      }
    }, 150);
  };

  const handleSuggestionClick = (tag: string) => {
    addTag(tag);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <Badge 
            key={tag} 
            variant="outline" 
            className="gap-1 bg-cyan-950/50 border/50 text-primary hover:bg-cyan-900/50 shadow-[0_0_5px_rgba(6,182,212,0.2)] font-mono"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-rose-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      {!disabled && value.length < maxTags && (
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            autoComplete="off"
            className="bg-card/50 border/50 text-foreground placeholder:text-cyan-900/50 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 font-mono transition-all duration-300 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 max-h-48 overflow-auto rounded-md border border/50 bg-background/95 p-1 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-sm"
            >
              {filteredSuggestions.map((tag, index) => (
                <div
                  key={tag}
                  className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none font-mono transition-colors ${
                    index === selectedIndex
                      ? 'bg-cyan-950/50 text-primary'
                      : 'hover:bg-cyan-950/30 hover:text-primary text-muted-foreground'
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSuggestionClick(tag)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Badge variant="outline" className="mr-2 border/50 text-foreground0 bg-card/50">
                    {tag}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {value.length >= maxTags && (
        <p className="text-sm text-rose-500/70 font-mono">
          Maximum {maxTags} tags reached
        </p>
      )}
    </div>
  );
}
