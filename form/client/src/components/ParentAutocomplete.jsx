import { useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";

const ParentAutocomplete = ({
  label,
  parentType, // "father" or "mother"
  onSelect,
  error,
  firstNameValue = "",
  middleNameValue = "",
  lastNameValue = "",
  vansh = "",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vanshNotSelected, setVanshNotSelected] = useState(!vansh);
  const wrapperRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Update vansh not selected state when vansh prop changes
  useEffect(() => {
    setVanshNotSelected(!vansh);
  }, [vansh]);

  // Search for parents
  const searchMembers = useCallback(async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    // Block search if vansh is not selected
    if (!vansh) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get("/api/family/search", {
        params: { query, vansh },
      });

      if (response.data.success) {
        setSuggestions(response.data.data);
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Error searching members:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [vansh]);

  // Handle input change with debouncing
  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setInputValue(value);

      // Clear previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Trigger search immediately
      if (value.trim()) {
        searchMembers(value);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    },
    [searchMembers]
  );

  // Handle suggestion click
  const handleSelectSuggestion = useCallback(
    (member) => {
      onSelect({
        serNo: member.serNo || null,
        firstName: member.firstName || "",
        middleName: member.middleName || "",
        lastName: member.lastName || "",
        email: member.email || "",
        mobileNumber: member.mobileNumber || "",
        dateOfBirth: member.dateOfBirth || "",
        profileImage: member.profileImage || null,
      });

      setInputValue("");
      setSuggestions([]);
      setIsOpen(false);
    },
    [onSelect]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        <span className="text-red-500"> *</span>
      </label>
      {vanshNotSelected && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm">
          <p className="text-yellow-800 font-medium">
            ⚠️ Please enter Vansh in Personal Details first to search for parents.
          </p>
        </div>
      )}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue && setIsOpen(true)}
          placeholder={vanshNotSelected ? `Please set Vansh first...` : `Search for ${parentType} by name...`}
          disabled={vanshNotSelected}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-primary-500 focus:ring-primary-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600"></div>
          </div>
        )}
      </div>

      {/* Dropdown suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-300 bg-white shadow-lg">
          {suggestions.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => handleSelectSuggestion(member)}
              className="flex w-full items-center gap-3 border-b border-slate-200 px-4 py-3 text-left transition hover:bg-primary-50 last:border-b-0"
            >
              {member.profileImage && (
                <img
                  src={
                    member.profileImage.data
                      ? `data:${member.profileImage.mimeType};base64,${member.profileImage.data}`
                      : member.profileImage
                  }
                  alt={member.displayName}
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-slate-900">{member.displayName}</p>
                <p className="text-xs text-slate-500">
                  {member.email || member.serNo || member.vansh || "Member"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Show current values filled in */}
      {(firstNameValue || middleNameValue || lastNameValue) && !inputValue && (
        <div className="mt-2 rounded-lg bg-primary-50 border border-primary-200 p-3 text-sm">
          <p className="text-primary-900 font-medium">
            {firstNameValue} {middleNameValue} {lastNameValue}
          </p>
          {error && <p className="text-xs font-medium text-red-500 mt-1">{error}</p>}
        </div>
      )}

      {error && !firstNameValue && (
        <p className="text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
};

export default ParentAutocomplete;