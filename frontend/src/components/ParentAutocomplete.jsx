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

  useEffect(() => {
    if (firstNameValue || middleNameValue || lastNameValue) {
      const parts = [firstNameValue, middleNameValue, lastNameValue].filter(Boolean);
      setInputValue(parts.join(" "));
    }
  }, [firstNameValue, middleNameValue, lastNameValue]);

  // Search for parents
  const searchMembers = useCallback(
    async (query) => {
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
    },
    [vansh]
  );

  // Handle input change with debouncing
  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setInputValue(value);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const trimmed = value.trim();
        // Only trigger search for reasonably sized input to reduce requests
        // and improve perceived performance on large datasets.
        if (trimmed && trimmed.length >= 2) {
          searchMembers(trimmed);
        } else {
          setSuggestions([]);
          setIsOpen(false);
        }
      }, 300);
    },
    [searchMembers]
  );

  const getProfileImageSrc = useCallback((profileImage) => {
    if (!profileImage) return null;
    if (typeof profileImage === "string") {
      if (profileImage.startsWith("data:")) return profileImage;
      if (profileImage.startsWith("http://") || profileImage.startsWith("https://")) return profileImage;
      return `data:image/jpeg;base64,${profileImage}`;
    }
    if (profileImage.data && profileImage.mimeType) {
      return `data:${profileImage.mimeType};base64,${profileImage.data}`;
    }
    return null;
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    onSelect({
      serNo: suggestion.serNo,
      firstName: suggestion.firstName,
      middleName: suggestion.middleName,
      lastName: suggestion.lastName,
      email: suggestion.email,
      mobileNumber: suggestion.mobileNumber,
      dateOfBirth: suggestion.dateOfBirth,
      profileImage: suggestion.profileImage,
    });
    const displayName = suggestion.name || [suggestion.firstName, suggestion.middleName, suggestion.lastName].filter(Boolean).join(" ");
    setInputValue(displayName);
    setSuggestions([]);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <label className="block text-sm font-medium text-slate-700">
        {label}
        <span className="text-red-500"> *</span>
      </label>

      {vanshNotSelected && (
        <p className="text-xs text-amber-600">
          ⚠️ Please select Vansh first to search for parents
        </p>
      )}

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={
            vanshNotSelected
              ? "Select Vansh first..."
              : `Search ${label.toLowerCase()}...`
          }
          disabled={vanshNotSelected}
          autoComplete="off"
          className={`w-full rounded-lg border px-4 py-3 text-sm shadow-sm transition focus:outline-none ${
            vanshNotSelected
              ? "border-slate-200 bg-slate-50 text-slate-500"
              : "border-slate-300 bg-white text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
          }`}
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600"></div>
          </div>
        )}

        {isOpen && suggestions.length > 0 && (
          <div className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-300 bg-white shadow-lg">
            {suggestions.map((suggestion) => {
              const imageSrc = getProfileImageSrc(suggestion.profileImage);
              const initials = [suggestion.firstName, suggestion.lastName]
                .filter(Boolean)
                .map((name) => name.charAt(0).toUpperCase())
                .join("") || "?";

              return (
                <button
                  key={suggestion.serNo}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex w-full items-center gap-3 border-b border-slate-200 px-4 py-3 text-left hover:bg-amber-50"
                >
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={suggestion.name}
                      className="h-10 w-10 flex-shrink-0 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
                      {initials}
                    </span>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{suggestion.name}</p>
                    {suggestion.email && (
                      <p className="text-xs text-slate-600">{suggestion.email}</p>
                    )}
                    {suggestion.mobileNumber && (
                      <p className="text-xs text-slate-500">
                        {suggestion.mobileNumber.replace(/\d(?=\d{2})/g, '*')}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {isOpen && inputValue && suggestions.length === 0 && !isLoading && (
          <div className="absolute top-full z-10 mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 shadow-lg">
            No matches found
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
};

export default ParentAutocomplete;