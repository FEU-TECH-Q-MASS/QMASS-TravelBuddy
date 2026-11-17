export default function SectionIntro({
  eyebrow,
  title,
  children,
  center = false,
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="section-title">{title}</h2>
      {children && (
        <p className="mt-4 text-base leading-7 text-slate-500">{children}</p>
      )}
    </div>
  );
}
