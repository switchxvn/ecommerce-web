import { useToast as useVueToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

export const useNotificationToast = () => {
  const toast = useVueToast();

  return {
    success: (message: string) => {
      toast.success(message, {
        position: 'top-right',
        duration: 3000,
        dismissible: true,
        pauseOnHover: true,
      });
    },
    error: (message: string) => {
      toast.error(message, {
        position: 'top-right',
        duration: 5000,
        dismissible: true,
        pauseOnHover: true,
      });
    },
    warning: (message: string) => {
      toast.warning(message, {
        position: 'top-right',
        duration: 4000,
        dismissible: true,
        pauseOnHover: true,
      });
    },
    info: (message: string) => {
      toast.info(message, {
        position: 'top-right',
        duration: 3000,
        dismissible: true,
        pauseOnHover: true,
      });
    },
  };
}; 
