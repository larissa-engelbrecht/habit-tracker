import { useState, useCallback } from 'react';
import type { ModalType } from '../components/UniversalModal';

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

interface UseModalReturn {
  modalState: ModalState;
  showModal: (config: Omit<ModalState, 'isOpen'>) => void;
  showSuccess: (title: string, message: string, autoClose?: boolean) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string, autoClose?: boolean) => void;
  showConfirm: (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => void;
  closeModal: () => void;
}

export const useModal = (): UseModalReturn => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
    autoClose: false,
    autoCloseDelay: 3000
  });

  const showModal = useCallback((config: Omit<ModalState, 'isOpen'>) => {
    setModalState({
      isOpen: true,
      ...config
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showSuccess = useCallback((title: string, message: string, autoClose: boolean = true) => {
    showModal({
      type: 'success',
      title,
      message,
      autoClose,
      autoCloseDelay: 3000,
      confirmText: 'Great!'
    });
  }, [showModal]);

  const showError = useCallback((title: string, message: string) => {
    showModal({
      type: 'error',
      title,
      message,
      confirmText: 'OK',
      autoClose: false
    });
  }, [showModal]);

  const showWarning = useCallback((title: string, message: string) => {
    showModal({
      type: 'warning',
      title,
      message,
      confirmText: 'Got it',
      autoClose: false
    });
  }, [showModal]);

  const showInfo = useCallback((title: string, message: string, autoClose: boolean = true) => {
    showModal({
      type: 'info',
      title,
      message,
      autoClose,
      autoCloseDelay: 3000,
      confirmText: 'OK'
    });
  }, [showModal]);

  const showConfirm = useCallback((
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) => {
    showModal({
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        onConfirm();
        closeModal();
      },
      onCancel: () => {
        if (onCancel) onCancel();
        closeModal();
      },
      confirmText,
      cancelText,
      showCancel: true,
      autoClose: false
    });
  }, [showModal, closeModal]);

  return {
    modalState,
    showModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    closeModal
  };
};