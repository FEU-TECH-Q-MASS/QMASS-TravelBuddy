import { destinationOptions, findDestination, palawanOptions } from "@/lib/travelOptions";

export default function DestinationField({ value, onChange, error, id = "destination", className }) {
  const selected = findDestination(value);
  const area = selected?.parent || selected?.code || value;
  const isPalawan = area === "PAL";
  const fieldProps = { "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined };

  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">Destination</label>
      <select id={id} className="input mt-2" name={isPalawan ? "destinationArea" : "destination"} value={area}
        onChange={(event) => onChange(event.target.value)} required {...(!isPalawan && fieldProps)}>
        <option value="">Choose destination</option>
        {area && !selected && <option value={area}>{area}</option>}
        {destinationOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
      </select>
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
      {error && <span id={`${id}-error`} className="mt-2 block text-xs text-red-700">{error}</span>}
    </div>
  );
}
