import { create } from "zustand";

export const useModalStore = create((set) => ({
    isOpen: false,
    responseModal: null,
    title: "Atención",
    message: "",

    showModal: (title, message, type) => {
        set({
            isOpen: true,
            responseModal: null,
            title: title ?? "Atención",
            message: message ?? "",
        });
    },

    setResponse: (response) => {
        set({
            responseModal: response,
            isOpen: false,
        });
    },
}));
