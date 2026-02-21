import { create } from "zustand";

interface PosState {
  currentShiftId: string | null;
  activeTableIds: string[];
  setCurrentShiftId: (id: string | null) => void;
  setActiveTableIds: (ids: string[]) => void;
}

export const usePosStore = create<PosState>((set) => ({
  currentShiftId: null,
  activeTableIds: [],
  setCurrentShiftId: (id) => set({ currentShiftId: id }),
  setActiveTableIds: (ids) => set({ activeTableIds: ids }),
}));
