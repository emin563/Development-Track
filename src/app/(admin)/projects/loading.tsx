import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-[120px]" />
          <Skeleton className="h-4 w-[220px]" />
        </div>
        <Skeleton className="h-9 w-[110px]" />
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex gap-4 border-b border-border pb-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-7 w-[80px]" />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-md">
        <div className="p-4 border-b">
          <Skeleton className="h-5 w-full" />
        </div>
        <div className="p-4 flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
