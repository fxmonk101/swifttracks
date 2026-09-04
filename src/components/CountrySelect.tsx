import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/geocoding";

interface CountrySelectProps {
  /** Form field name — a hidden input carries the value for native FormData submits. */
  name?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

/**
 * Searchable country picker covering every supported country so shipments can be
 * created — and geocoded on the tracking map — anywhere in the world.
 */
export const CountrySelect = ({
  name,
  defaultValue = "US",
  value,
  onValueChange,
  className,
}: CountrySelectProps) => {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;

  const label = useMemo(
    () => COUNTRY_OPTIONS.find((c) => c.value === selected)?.label ?? "Select country",
    [selected]
  );

  const select = (next: string) => {
    setInternal(next);
    onValueChange?.(next);
    setOpen(false);
  };

  return (
    <>
      {name && <input type="hidden" name={name} value={selected} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", className)}
          >
            <span className="truncate">{label}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[60]" align="start">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList className="max-h-72">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {COUNTRY_OPTIONS.map((country) => (
                  <CommandItem
                    key={country.value}
                    value={`${country.label} ${country.value}`}
                    onSelect={() => select(country.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected === country.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {country.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default CountrySelect;
