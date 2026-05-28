import { Card } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <div className="grid gap-6">
      <Card className="grid gap-4 text-center">
        <p aria-hidden="true" className="text-5xl">
          📡
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          You&apos;re offline
        </h1>
        <p className="text-sm text-slate-600">
          It looks like you&apos;ve lost your internet connection. Some features
          may be unavailable until you reconnect.
        </p>
        <p className="text-sm text-slate-500">
          Previously viewed pages and data may still be available from your
          device cache.
        </p>
      </Card>
    </div>
  );
}
