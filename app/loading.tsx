import { DuendeLoading } from "@/components/ui/duende-loading";

export default function Loading() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center px-4">
      <DuendeLoading label="Cargando página" />
    </div>
  );
}
