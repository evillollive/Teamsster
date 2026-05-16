import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <Card className="grid gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
          404
        </p>
        <h1 className="mt-2 text-3xl font-semibold">That team huddle moved.</h1>
        <p className="mt-2 text-sm text-slate-600">
          Try one of the scaffolded routes while the rest of Teamsster comes
          together.
        </p>
      </div>
      <Button asChild className="w-fit">
        <Link href="/">Back home</Link>
      </Button>
    </Card>
  );
}
