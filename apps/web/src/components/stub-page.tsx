import { Card } from "@/components/ui/card";

export function StubPage({
  eyebrow,
  title,
  description,
  bullets,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <div className="grid gap-4">
      <Card className="bg-white">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {bullets.map((bullet) => (
          <Card className="h-full" key={bullet}>
            <p className="text-sm leading-6 text-slate-700">{bullet}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
