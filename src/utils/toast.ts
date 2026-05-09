import { toast } from "sonner";

export const successToast = (message: string) => {
  toast.success(message, {
    duration: 4000,
    style: {
      background: "#3DBFA0",
      color: "#fff",
    },
  });
};

export const errorToast = (message: string) => {
  toast.error(message, {
    duration: 3000,
    style: {
      background: "#ff4d4f",
      color: "#fff",
    },
  });
}