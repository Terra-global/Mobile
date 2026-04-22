import { create } from 'zustand';

type AlertType = 'success' | 'error' | 'info';

interface AlertState {
  visible: boolean;
  message: string;
  type: AlertType;
  showAlert: (message: string, type?: AlertType) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  message: '',
  type: 'info',
  showAlert: (message, type = 'info') => {
    set({ visible: true, message, type });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      set({ visible: false });
    }, 3000);
  },
  hideAlert: () => set({ visible: false }),
}));
