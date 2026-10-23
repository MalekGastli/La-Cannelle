import { MISSING } from "@/lib/config/legal";

/** Renders a value, or a visible placeholder when a mandatory detail has not been configured yet. */
export default function Field({ value }: { value: string | null }) {
  return value ? <>{value}</> : <span className="missing">{MISSING}</span>;
}
