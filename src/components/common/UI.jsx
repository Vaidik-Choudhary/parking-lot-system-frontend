import React from 'react';
import { IconHourglass, IconCheckCircle, IconCheck, IconX, IconWrench, IconCircleDot, IconRefresh, IconClock, IconTag } from './Icons';

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
          <button className="modal-close" onClick={onClose}><IconX size={18} /></button>
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
        ><IconX size={16} /></button>
      )}
    </div>
  );
}

/* ── Card ────────────────────────────────────────────── */
export function Card({ children, className = '', style = {} }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}

/* ── Status Badge ────────────────────────────────────── */
const badgeIcon = (IconComp, size = 12) => <IconComp size={size} style={{ verticalAlign: '-2px', marginRight: 4 }} />;

export function StatusBadge({ status, type, children }) {
  const config = {
    RESERVED:   { cls: 'badge-warning',  icon: badgeIcon(IconHourglass),  label: 'Reserved'    },
    ACTIVE:     { cls: 'badge-success',  icon: badgeIcon(IconCheckCircle), label: 'Active'     },
    COMPLETED:  { cls: 'badge-primary',  icon: badgeIcon(IconCheck),       label: 'Completed'  },
    CANCELLED:  { cls: 'badge-danger',   icon: badgeIcon(IconX),           label: 'Cancelled'  },
    PENDING:    { cls: 'badge-warning',  icon: badgeIcon(IconHourglass),  label: 'Pending'     },
    PAID:       { cls: 'badge-success',  icon: badgeIcon(IconCheckCircle), label: 'Paid'       },
    REFUNDED:   { cls: 'badge-info',     icon: badgeIcon(IconRefresh),     label: 'Refunded'   },
    FAILED:     { cls: 'badge-danger',   icon: badgeIcon(IconX),           label: 'Failed'     },
    AVAILABLE:  { cls: 'badge-success',  icon: badgeIcon(IconCheck),       label: 'Available'  },
    OCCUPIED:   { cls: 'badge-danger',   icon: badgeIcon(IconCircleDot),   label: 'Occupied'   },
    MAINTENANCE:{ cls: 'badge-muted',    icon: badgeIcon(IconWrench),     label: 'Maintenance' },
    OPEN:       { cls: 'badge-danger',   icon: badgeIcon(IconTag),         label: 'Open'       },
    IN_PROGRESS:{ cls: 'badge-info',     icon: badgeIcon(IconClock),       label: 'In Progress'},
    RESOLVED:   { cls: 'badge-success',  icon: badgeIcon(IconCheckCircle), label: 'Resolved'   },
    true:       { cls: 'badge-success',  icon: badgeIcon(IconCheck),       label: 'Active'     },
    false:      { cls: 'badge-danger',   icon: badgeIcon(IconX),           label: 'Inactive'   },
  };

  const badgeTypeCls = type ? `badge-${type}` : '';
  const { cls, icon, label } = config[status] || { cls: badgeTypeCls || 'badge-muted', icon: null, label: status };
  
  return <span className={`badge ${cls}`}>{icon}{children || label}</span>;
}

/* ── Empty State ─────────────────────────────────────── */
export function EmptyState({ icon, title, message, action }) {
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
