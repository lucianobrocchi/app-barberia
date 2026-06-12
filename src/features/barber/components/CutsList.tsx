import { Scissors } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { CutItem } from './CutItem';
import type { TodayCut } from '../hooks/useTodayCuts';

interface CutsListProps {
  cuts: TodayCut[];
  isLoading: boolean;
}

export function CutsList({ cuts, isLoading }: CutsListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cuts.length === 0) {
    return (
      <div className="text-center py-12 rounded-2xl border border-dashed border-white/10">
        <Scissors className="w-7 h-7 text-[#a1a1aa] mx-auto mb-3" />
        <p className="text-sm text-[#a1a1aa]">Todavía no registraste cortes hoy</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <AnimatePresence initial={false}>
        {cuts.map((cut) => (
          <motion.div
            key={cut.id}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CutItem cut={cut} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
