import { create } from "zustand";

export const useToastStore = create((set) => ({
  toastArray: [],
  addToast: (message, type) => {
    set(state => {
      const newIndex = state.toastArray.length > 0 ? state.toastArray[state.toastArray.length - 1].index + 1 : 0;
      return { toastArray: [...state.toastArray, { message, type, index: newIndex }] };
    });
  },

  removeToast: (index) => {
      set(state => {
        return { toastArray: state.toastArray.filter((_, i) => i !== index) };
      });
  }
}));