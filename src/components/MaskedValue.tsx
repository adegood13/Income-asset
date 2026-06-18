// Renders an identifier-style value, masked unless global reveal is on.
import { useApp } from "../state/AppContext";
import { maskIdentifier } from "../mock/tokenization";

interface Props {
  label: string;
  value: string;
  className?: string;
}

// Standalone masked text (e.g. borrower name in a table). Always treats the
// value as an identifier and applies the global reveal toggle.
export function MaskedText({ label, value, className }: Props) {
  const { reveal } = useApp();
  const shown = reveal ? value : maskIdentifier(label, value);
  return <span className={className}>{shown}</span>;
}
