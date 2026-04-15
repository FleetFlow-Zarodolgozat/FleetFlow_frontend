import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/CustomModal.css';

const CustomModal = ({
  isOpen,
  onClose,
  title,
  children,
  primaryAction,
  secondaryAction,
  size = 'md',
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (event) => {
    if (!closeOnBackdrop) return;
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return createPortal(
    <div className="ff-modal-overlay" onMouseDown={handleBackdropClick} role="presentation">
      <div className={`ff-modal-card size-${size}`} role="dialog" aria-modal="true" aria-labelledby="ff-modal-title">
        <div className="ff-modal-header">
          <div className="ff-modal-title-wrap">
            {title && (
              <h2 id="ff-modal-title" className="ff-modal-title">
                {title}
              </h2>
            )}
          </div>
        </div>
        <div className="ff-modal-body">{children}</div>
        {(primaryAction || secondaryAction) && (
          <div className="ff-modal-footer">
            {secondaryAction && (
              <button
                type="button"
                className="ff-modal-btn secondary"
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled}
              >
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button
                type="button"
                className={`ff-modal-btn primary ${primaryAction.variant || ''}`}
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
              >
                {primaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default CustomModal;
