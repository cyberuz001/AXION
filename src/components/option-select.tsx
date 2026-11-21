"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

type Option = { value: string; label: string; disabled?: boolean };

export function OptionSelect({ label, options, value, defaultValue, onValueChange, name, inline, disabled, compact, align = "end" }: {
  label: string;
  options: Option[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  inline?: boolean;
  disabled?: boolean;
  compact?: boolean;
  align?: "start" | "end";
}) {
  const popup = <Select.Content className="option-popup" position="popper" sideOffset={6}
    collisionPadding={12} align={align} aria-label={label}>
    <Select.ScrollUpButton className="option-scroll"><ChevronUp size={15} /></Select.ScrollUpButton>
    <Select.Viewport className="option-viewport">
      {options.map((option) => <Select.Item key={option.value} className="option-item" value={option.value} disabled={option.disabled}>
        <Select.ItemText>{option.label}</Select.ItemText>
        <Select.ItemIndicator className="option-check"><Check size={15} /></Select.ItemIndicator>
      </Select.Item>)}
    </Select.Viewport>
    <Select.ScrollDownButton className="option-scroll"><ChevronDown size={15} /></Select.ScrollDownButton>
  </Select.Content>;

  return <Select.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} name={name} disabled={disabled}>
    <Select.Trigger className={compact ? "option-trigger option-compact" : "option-trigger"} aria-label={label}>
      <Select.Value />
      <Select.Icon asChild><ChevronDown size={16} /></Select.Icon>
    </Select.Trigger>
    {inline ? popup : <Select.Portal>{popup}</Select.Portal>}
  </Select.Root>;
}
