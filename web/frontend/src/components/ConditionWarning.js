
export default function ConditionWarning({ warning }) {
  if (!warning) return null;

  const isModerate =
    warning.severity === "moderate" ||
    warning.severity === "high";

  return (
    <div
      role="status"
      className={`mt-3 rounded-xl border p-3 ${
        isModerate
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-blue-200 bg-blue-50 text-blue-900"
      }`}
    >
      <div className="flex items-start gap-2">
        <span aria-hidden="true">⚠</span>

        <div>
          <p className="text-sm font-semibold">
            {warning.code === "OUTDOOR_RAIN_RISK"
              ? "Weather may affect this activity"
              : "Travel condition notice"}
          </p>

          <p className="mt-1 text-sm">
            {warning.message}
          </p>

          {warning.sourceType && (
            <p className="mt-2 text-xs opacity-75">
              Source: {warning.sourceType}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
