export const ms = {
  card: "rounded-3xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#2f2f2f] dark:shadow-none",
  subtleCard: "rounded-3xl bg-[#f4f4f4] p-4 dark:bg-[#212121]",
  title: "text-[15px] font-semibold tracking-tight text-[#0d0d0d] dark:text-[#ececec]",
  text: "text-sm text-[#0d0d0d] dark:text-[#ececec]",
  muted: "text-xs text-[#5d5d5d] dark:text-[#b4b4b4]",
  label: "mb-1.5 ml-1 block text-xs font-medium text-[#5d5d5d] dark:text-[#b4b4b4]",
  input:
    "w-full rounded-full border border-black/[0.08] bg-[#f4f4f4] px-4 py-2.5 text-sm text-[#0d0d0d] outline-none transition placeholder:text-[#8f8f8f] focus:border-[#0285ff] focus:ring-4 focus:ring-[#0285ff]/15 dark:border-white/[0.08] dark:bg-[#212121] dark:text-[#ececec] dark:placeholder:text-[#8e8e8e]",
  textarea:
    "w-full rounded-3xl border border-black/[0.08] bg-[#f4f4f4] px-4 py-3 text-sm leading-relaxed text-[#0d0d0d] outline-none transition placeholder:text-[#8f8f8f] focus:border-[#0285ff] focus:ring-4 focus:ring-[#0285ff]/15 dark:border-white/[0.08] dark:bg-[#212121] dark:text-[#ececec] dark:placeholder:text-[#8e8e8e]",
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-[#0285ff] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#339cff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-full border border-black/[0.1] bg-white px-4 py-2 text-sm font-medium text-[#0d0d0d] transition hover:bg-[#f4f4f4] dark:border-white/[0.14] dark:bg-transparent dark:text-[#ececec] dark:hover:bg-[#383838]",
  ghost:
    "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[#5d5d5d] transition hover:bg-[#f4f4f4] hover:text-[#0d0d0d] dark:text-[#b4b4b4] dark:hover:bg-[#383838] dark:hover:text-[#ececec]",
  danger:
    "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10",
  chip: "inline-flex items-center rounded-full bg-[#0285ff]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#0170d6] dark:bg-[#0285ff]/15 dark:text-[#5aaeff]",
  neutralChip:
    "inline-flex items-center rounded-full bg-[#f4f4f4] px-2.5 py-0.5 text-[11px] font-medium text-[#5d5d5d] dark:bg-white/[0.06] dark:text-[#b4b4b4]",
  segment: "inline-flex flex-wrap gap-0.5 rounded-full bg-[#f4f4f4] p-1 dark:bg-[#2f2f2f]",
  segmentBtn: (active) =>
    `rounded-full px-4 py-1.5 text-xs font-medium transition ${
      active
        ? "bg-[#0285ff] text-white shadow-sm"
        : "text-[#5d5d5d] hover:text-[#0d0d0d] dark:text-[#b4b4b4] dark:hover:text-[#ececec]"
    }`,
  pill: (active) =>
    `rounded-full px-4 py-2 text-xs font-medium transition ${
      active
        ? "bg-[#0285ff] text-white"
        : "bg-[#f4f4f4] text-[#5d5d5d] hover:bg-[#ececec] hover:text-[#0d0d0d] dark:bg-[#212121] dark:text-[#b4b4b4] dark:hover:bg-[#383838] dark:hover:text-[#ececec]"
    }`,
};
