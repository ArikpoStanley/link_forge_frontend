import GenerateForm from "@/components/generate-form";

export default function HomePage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-x-hidden px-5 py-8 sm:px-8 lg:px-10">
      <div className="atmosphere" aria-hidden />

      <div className="relative mx-auto w-full max-w-7xl">
        <header className="mb-5 flex shrink-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] sm:text-4xl lg:text-[2.75rem]">
              Linkforge
            </p>
            <p className="mt-1.5 max-w-xl text-sm leading-snug text-[var(--ink-muted)] sm:text-base">
              Generate a Modular KYC link, then verify inline or open the hosted
              flow.
            </p>
          </div>
          <p className="hidden text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] lg:block">
            Modular KYC · TransID / Fuspay
          </p>
        </header>

        <GenerateForm />
      </div>
    </main>
  );
}
