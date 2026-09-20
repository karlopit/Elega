import { SkeletonBlock } from "@/components/SkeletonBlock";

export default function Loading() {
  return (
    <main className="bg-paper px-5 py-16 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="mt-5 h-14 w-80 max-w-full" />
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item}>
              <SkeletonBlock className="aspect-[4/5] w-full" />
              <SkeletonBlock className="mt-4 h-6 w-3/4" />
              <SkeletonBlock className="mt-3 h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
