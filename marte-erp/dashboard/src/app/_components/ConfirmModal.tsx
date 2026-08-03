import styles from './ConfirmModal.module.css';
import { IconWarning, IconHelpCircle } from './Icons';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={`${styles.iconWrapper} ${isDestructive ? styles.iconDestructive : styles.iconPrimary}`}>
            {isDestructive ? <IconWarning size={24} /> : <IconHelpCircle size={24} />}
          </div>
          <h3 className={styles.title}>{title}</h3>
        </div>
        
        <div className={styles.body}>
          <p>{message}</p>
        </div>
        
        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onCancel}>
            {cancelText}
          </button>
          <button 
            className={`${styles.btnConfirm} ${isDestructive ? styles.btnDestructive : styles.btnPrimary}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
