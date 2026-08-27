import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

const emptyValue = '__empty__';

export function AppSelect({
  id,
  label,
  value,
  options,
  invalid = false,
  onValueChange,
}: {
  id?: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  invalid?: boolean;
  onValueChange: (value: string) => void;
}) {
  return (
    <Select
      value={value || emptyValue}
      onValueChange={(nextValue) => {
        onValueChange(nextValue === emptyValue ? '' : nextValue);
      }}
    >
      <SelectTrigger
        aria-invalid={invalid || undefined}
        aria-label={label}
        className="app-select-trigger w-full"
        id={id}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="app-select-content" position="popper">
        {options.map((option) => (
          <SelectItem
            key={option.value || emptyValue}
            value={option.value || emptyValue}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
