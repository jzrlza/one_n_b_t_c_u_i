import React, { useEffect, useRef, useState } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Handle animations and visibility
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle focus trap and ARIA attributes
  useEffect(() => {
    if (isOpen && isVisible) {
      // Save the element that had focus before modal opened
      previousFocusRef.current = document.activeElement;
      
      // Focus the modal container first for screen reader context
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);

      // Prevent scrolling of background content
      document.body.style.overflow = 'hidden';

      // Add event listeners
      const handleEscape = (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      };

      const handleFocusIn = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          closeButtonRef.current?.focus();
        }
      };

      document.addEventListener('keydown', handleEscape, true);
      document.addEventListener('focusin', handleFocusIn, true);

      // Hide background content from screen readers
      const mainContent = document.querySelector('main, [role="main"]');
      const headers = document.querySelectorAll('header');
      const footers = document.querySelectorAll('footer');
      const navs = document.querySelectorAll('nav:not(.modal-content nav)');
      
      const hiddenElements = [];
      
      [mainContent, ...headers, ...footers, ...navs].forEach(el => {
        if (el && !el.closest('.modal-content')) {
          const currentHidden = el.getAttribute('aria-hidden');
          const currentInert = el.getAttribute('inert');
          
          hiddenElements.push({
            element: el,
            ariaHidden: currentHidden,
            inert: currentInert
          });
          
          el.setAttribute('aria-hidden', 'true');
          el.setAttribute('inert', '');
        }
      });

      return () => {
        document.removeEventListener('keydown', handleEscape, true);
        document.removeEventListener('focusin', handleFocusIn, true);
        document.body.style.overflow = '';
        
        // Restore accessibility to background content
        hiddenElements.forEach(({ element, ariaHidden, inert }) => {
          if (ariaHidden === null) {
            element.removeAttribute('aria-hidden');
          } else {
            element.setAttribute('aria-hidden', ariaHidden);
          }
          
          if (inert === null) {
            element.removeAttribute('inert');
          } else {
            element.setAttribute('inert', inert);
          }
        });
        
        // Return focus to the element that had it before modal opened
        setTimeout(() => {
          if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
            previousFocusRef.current.focus();
          } else {
            // Fallback: focus the first focusable element in the document
            const firstFocusable = document.querySelector(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            firstFocusable?.focus();
          }
        }, 10);
      };
    }
  }, [isOpen, isVisible, onClose]);

  // Handle focus trap within modal (WCAG 2.4.3)
  const handleKeyDown = (e) => {
    if (!modalRef.current) return;

    // Get all focusable elements in modal
    const focusableElements = modalRef.current.querySelectorAll(
      'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Tab key (WCAG 2.1.2)
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`modal-overlay ${isVisible ? 'modal-visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      ref={modalRef}
      tabIndex={-1}
    >
      <div 
        className={`modal-content ${isVisible ? 'modal-content-visible' : ''}`}
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            <span className="sr-only">แจ้งเตือน: </span>
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            className="modal-close"
            onClick={onClose}
            aria-label={`ปิดหน้าต่างแจ้งเตือน ${title}`}
            data-wcag-focusable="true"
          >
            <span aria-hidden="true">×</span>
            <span className="sr-only">ปิด</span>
          </button>
        </div>
        
        <div id="modal-description" className="modal-body" role="region" aria-live="polite">
          <div className="modal-content-wrapper">
            {children}
          </div>
        </div>
        
        {/* Visual focus indicator for keyboard users (WCAG 2.4.7) */}
        <div className="focus-indicator" aria-hidden="true"></div>
      </div>
    </div>
  );
};

export default Modal;