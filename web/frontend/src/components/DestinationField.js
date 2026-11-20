import { destinationOptions, findDestination, palawanOptions } from "@/lib/travelOptions";
import TripOptionField from "@/components/TripOptionField";

export default function DestinationField({ value, onChange, error, id = "destination", className }) {
  const selected = findDestination(value);
  const area = selected?.parent || selected?.code || value;
  const isPalawan = area === "PAL";
  const fieldProps = { "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined };
  const options = area && !selected ? [[area, area], ...destinationOptions] : destinationOptions;

  return (
    <div className={className}>
      <TripOptionField id={id} label="Destination" placeholder="Choose destination" options={options}
        value={area} onChange={(code) => onChange(code === "PAL" && selected?.parent ? selected.code : code)}
        error={isPalawan ? undefined : error} />
      {isPalawan && (
        <div className="mt-3">
          <label htmlFor={`${id}-base`} className="field-label">Where in Palawan?</label>
          <select id={`${id}-base`} className="input mt-2" name="destination" value={selected?.parent ? selected.code : ""}
            onChange={(event) => onChange(event.target.value || "PAL")} required {...fieldProps}>
            <option value="">Choose a Palawan base</option>
            {palawanOptions.map(({ code, name, airport }) => <option key={code} value={code}>{name} ({airport})</option>)}
          </select>
        </div>
      )}
      {isPalawan && error && <span id={`${id}-error`} className="mt-2 block text-xs text-red-700">{error}</span>}
    </div>
  );
}
