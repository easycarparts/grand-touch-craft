import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Country = {
  code: string;
  name: string;
  dial: string;
  flag: string;
};

/** UAE first (default), then GCC, then common international markets. */
const COUNTRIES: Country[] = [
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { code: "BH", name: "Bahrain", dial: "+973", flag: "🇧🇭" },
  { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
  { code: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "JO", name: "Jordan", dial: "+962", flag: "🇯🇴" },
  { code: "LB", name: "Lebanon", dial: "+961", flag: "🇱🇧" },
  { code: "SY", name: "Syria", dial: "+963", flag: "🇸🇾" },
  { code: "IQ", name: "Iraq", dial: "+964", flag: "🇮🇶" },
  { code: "YE", name: "Yemen", dial: "+967", flag: "🇾🇪" },
  { code: "MA", name: "Morocco", dial: "+212", flag: "🇲🇦" },
  { code: "DZ", name: "Algeria", dial: "+213", flag: "🇩🇿" },
  { code: "TN", name: "Tunisia", dial: "+216", flag: "🇹🇳" },
  { code: "TR", name: "Turkey", dial: "+90", flag: "🇹🇷" },
  { code: "RU", name: "Russia", dial: "+7", flag: "🇷🇺" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", dial: "+32", flag: "🇧🇪" },
  { code: "CH", name: "Switzerland", dial: "+41", flag: "🇨🇭" },
  { code: "SE", name: "Sweden", dial: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norway", dial: "+47", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", dial: "+45", flag: "🇩🇰" },
  { code: "IE", name: "Ireland", dial: "+353", flag: "🇮🇪" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹" },
  { code: "PL", name: "Poland", dial: "+48", flag: "🇵🇱" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", dial: "+82", flag: "🇰🇷" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩" },
  { code: "TH", name: "Thailand", dial: "+66", flag: "🇹🇭" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷" },
  { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷" },
  { code: "MX", name: "Mexico", dial: "+52", flag: "🇲🇽" },
];

const DEFAULT_COUNTRY = COUNTRIES[0];

/** Longest dial first so "+971" wins over "+9" when matching. */
const COUNTRIES_BY_DIAL_LENGTH = [...COUNTRIES].sort(
  (a, b) => b.dial.length - a.dial.length,
);

const onlyDigits = (value: string) => value.replace(/\D/g, "");

/**
 * Loose 2/3/4 grouping that works reasonably well across most mobile formats
 * without hard-coding per-country rules. Good enough for visual feedback.
 */
const formatLocalDigits = (digits: string): string => {
  const d = onlyDigits(digits);
  if (!d) return "";
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 9) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 9)} ${d.slice(9, 13)}`;
};

const detectCountry = (fullValue: string): Country => {
  if (!fullValue) return DEFAULT_COUNTRY;
  const digits = onlyDigits(fullValue);
  if (!digits) return DEFAULT_COUNTRY;
  const cleaned = `+${digits}`;
  return (
    COUNTRIES_BY_DIAL_LENGTH.find((c) => cleaned.startsWith(c.dial)) ??
    DEFAULT_COUNTRY
  );
};

const stripDial = (fullValue: string, dial: string): string => {
  if (!fullValue) return "";
  const cleaned = `+${onlyDigits(fullValue)}`;
  if (cleaned.startsWith(dial)) return cleaned.slice(dial.length);
  return onlyDigits(fullValue);
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  inputClassName?: string;
  triggerClassName?: string;
  required?: boolean;
  autoComplete?: string;
  ariaLabel?: string;
};

/**
 * E.164-ish phone field with a country selector. Stores the canonical value
 * (e.g. "+971501234567") via `onChange` while displaying a friendly grouped
 * local number next to a flag + dial-code picker.
 */
export const PhoneInputWithCountry = ({
  value,
  onChange,
  placeholder,
  onFocus,
  onBlur,
  className,
  inputClassName,
  triggerClassName,
  required,
  autoComplete = "tel",
  ariaLabel = "Phone number",
}: Props) => {
  const [open, setOpen] = useState(false);

  const country = useMemo(() => detectCountry(value), [value]);
  const localDisplay = useMemo(
    () => formatLocalDigits(stripDial(value, country.dial)),
    [value, country.dial],
  );

  const handleLocalChange = (raw: string) => {
    const digits = onlyDigits(raw);
    if (!digits) {
      onChange("");
      return;
    }
    onChange(`${country.dial}${digits}`);
  };

  const handleSelectCountry = (next: Country) => {
    setOpen(false);
    const localDigits = onlyDigits(stripDial(value, country.dial));
    onChange(localDigits ? `${next.dial}${localDigits}` : next.dial);
  };

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-transparent transition-colors focus-within:border-[#f7b52b]/55 focus-within:ring-2 focus-within:ring-[#f7b52b]/30",
        className,
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Country code, currently ${country.name}`}
            className={cn(
              "flex shrink-0 items-center gap-1 border-r border-white/10 bg-white/[0.05] px-2 text-xs font-semibold text-white transition hover:bg-white/[0.09] sm:gap-1.5 sm:px-3 sm:text-sm",
              triggerClassName,
            )}
          >
            <span className="text-sm leading-none sm:text-base">{country.flag}</span>
            <span className="tabular-nums">{country.dial}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(18rem,calc(100vw-2rem))] border-white/10 bg-[#0c0c0c] p-0 text-white shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
        >
          <Command className="bg-transparent text-white">
            <CommandInput
              placeholder="Search country..."
              className="text-white placeholder:text-slate-500"
            />
            <CommandList className="max-h-72">
              <CommandEmpty className="py-4 text-center text-sm text-slate-400">
                No country found.
              </CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((c) => (
                  <CommandItem
                    key={c.code}
                    value={`${c.name} ${c.dial}`}
                    onSelect={() => handleSelectCountry(c)}
                    className="flex items-center gap-3 text-white aria-selected:bg-[#f7b52b]/15 aria-selected:text-white"
                  >
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="flex-1 truncate text-sm">{c.name}</span>
                    <span className="text-xs tabular-nums text-slate-400">
                      {c.dial}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <input
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        value={localDisplay}
        onChange={(event) => handleLocalChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        className={cn(
          "h-10 w-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none sm:px-3",
          inputClassName,
        )}
      />
    </div>
  );
};

export default PhoneInputWithCountry;
