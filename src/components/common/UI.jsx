import React from 'react';

/* ── Topbar ──────────────────────────────────────────── */
export function Topbar({ title, children, onMenuToggle }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
        <div className="topbar-title">{title}</div>
      </div>
      <div className="topbar-right">{children}</div>
    </header>
  );
}

/* ── Modal ───────────────────────────────────────────── */
export function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ── Spinner ─────────────────────────────────────────── */
export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner"></div>
    </div>
  );
}

/* ── Alert ───────────────────────────────────────────── */
export function Alert({ type = 'info', children, onClose }) {
  return (
    <div className={`alert alert-${type}`}>
      <span>{children}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{ marginLeft: 'auto', background: 'none', border: 'none',
                   cursor: 'pointer', fontSize: '1rem', opacity: 0.6 }}
        >✕</button>
      )}
    </div>
  );
}

/* ── Status Badge ────────────────────────────────────── */
export function StatusBadge({ status }) {
  const config = {
    RESERVED:   { cls: 'badge-warning',  label: '⏳ Reserved'  },
    ACTIVE:     { cls: 'badge-success',  label: '✅ Active'    },
    COMPLETED:  { cls: 'badge-primary',  label: '✔ Completed' },
    CANCELLED:  { cls: 'badge-danger',   label: '✕ Cancelled' },
    PENDING:    { cls: 'badge-warning',  label: '⏳ Pending'   },
    PAID:       { cls: 'badge-success',  label: '✅ Paid'      },
    REFUNDED:   { cls: 'badge-info',     label: '↩ Refunded'  },
    FAILED:     { cls: 'badge-danger',   label: '✕ Failed'    },
    AVAILABLE:  { cls: 'badge-success',  label: '✓ Available' },
    OCCUPIED:   { cls: 'badge-danger',   label: '● Occupied'  },
    MAINTENANCE:{ cls: 'badge-muted',    label: '🔧 Maintenance'},
    true:       { cls: 'badge-success',  label: '✓ Active'   },
    false:      { cls: 'badge-danger',   label: '✕ Inactive' },
  };
  const { cls, label } = config[status] || { cls: 'badge-muted', label: status };
  return <span className={`badge ${cls}`}>{label}</span>;
}

/* ── Empty State ─────────────────────────────────────── */
export function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

/* ── Confirm Dialog ──────────────────────────────────── */
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => { onConfirm(); onClose(); }}
          >
            Confirm
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
