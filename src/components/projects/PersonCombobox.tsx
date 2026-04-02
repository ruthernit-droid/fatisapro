"use client";

import { useState, useRef, useEffect } from "react";
import { Person } from "@/types";
import { getInitials } from "@/lib/utils";

interface PersonComboboxProps {
  value: string | null;
  onChange: (personId: string, person: Person) => void;
  persons: Person[];
  placeholder?: string;
  /** Dropdown en üstünde "Yeni kişi ekle" butonu gösterilsin mi? */
  onAddNew?: (searchText: string) => void;
  disabled?: boolean;
}

export default function PersonCombobox({
  value,
  onChange,
  persons,
  placeholder = "Kişi ara...",
  onAddNew,
  disabled = false,
}: PersonComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = value ? persons.find((p) => p.id === value) : null;

  // Dışarı tıklanınca kapat
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filtered = search.trim()
    ? persons.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.phone.includes(search) ||
          (p.companyName?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : persons;

  function handleSelect(person: Person) {
    onChange(person.id, person);
    setOpen(false);
    setSearch("");
  }

  function handleInputClick() {
    if (!disabled) {
      setOpen(true);
      setSearch("");
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleInputClick}
        disabled={disabled}
        className="w-full flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg bg-white text-sm text-left hover:border-neutral-400 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {selected ? (
          <>
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
              style={{ backgroundColor: "#6366f1" }}
            >
              {getInitials(selected.name)}
            </span>
            <span className="flex-1 truncate">{selected.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("", {} as Person);
              }}
              className="text-neutral-400 hover:text-neutral-600 ml-auto"
            >
              ✕
            </button>
          </>
        ) : (
          <span className="text-neutral-400">{placeholder}</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-neutral-100">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim veya telefon ile ara..."
              className="w-full px-2 py-1 text-sm border border-neutral-200 rounded focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {onAddNew && (
              <button
                type="button"
                onClick={() => {
                  onAddNew(search);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <span className="text-lg leading-none">+</span>
                <span>
                  {search.trim() ? `"${search}" ekle` : "Yeni kişi ekle"}
                </span>
              </button>
            )}
            {filtered.length === 0 && !onAddNew && (
              <p className="px-3 py-4 text-sm text-neutral-400 text-center">
                Kişi bulunamadı
              </p>
            )}
            {filtered.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => handleSelect(person)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                  value === person.id ? "bg-blue-50" : ""
                }`}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: "#6366f1" }}
                >
                  {getInitials(person.name)}
                </span>
                <div className="text-left">
                  <div className="font-medium text-neutral-800">{person.name}</div>
                  {person.companyName && (
                    <div className="text-xs text-neutral-500">{person.companyName}</div>
                  )}
                </div>
                {value === person.id && (
                  <span className="ml-auto text-blue-500">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
