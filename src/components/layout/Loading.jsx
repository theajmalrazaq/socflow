import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full space-y-6 px-2 py-4"
    >
      {/* Header Skeleton */}
      <div className="space-y-3 mb-8">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-5 w-96 rounded-lg" />
      </div>

      {/* Stats Cards Skeleton Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>

      {/* Main Content Area Skeleton */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </motion.div>
  );
}
