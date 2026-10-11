import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import MiniCalendar from './MiniCalendar';

export const IMPORTANCE_COLORS = ['#34C759', '#FFD60A', '#FF9500', '#FF3B30'];
export const IMPORTANCE_LABELS = ['Faible', 'Normale', 'Haute', 'Urgente'];

export const TASK_NOTIF_OPTIONS = [
  { key: 'same_9h',  label: '9h le jour même',      offsetDays: 0, hour: 9  },
  { key: 'before1',  label: '17h la veille',         offsetDays: 1, hour: 17 },
  { key: 'before2',  label: '17h 2 jours avant',     offsetDays: 2, hour: 17 },
  { key: 'before3',  label: '17h 3 jours avant',     offsetDays: 3, hour: 17 },
  { key: 'before4',  label: '17h 4 jours avant',     offsetDays: 4, hour: 17 },
];

export const parseDueDate = (str) => {
  if (!str) return null;
  const parts = str.substring(0, 10).split('-').map(Number);
  if (parts.length !== 3) return null;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return isNaN(d.getTime()) ? null : d;
};

export const TaskModal = ({ visible, subject, subjectColor, onClose, onSave, editTask = null }) => {
  const [title, setTitle] = useState('');
  const [importance, setImportance] = useState(0);
  const [dueDate, setDueDate] = useState(null);
  const [notifs, setNotifs] = useState({});
  const [showCal, setShowCal] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editTask) {
        setTitle(editTask.title || '');
        setImportance(editTask.importance ?? 0);
        setDueDate(editTask.dueDate ? parseDueDate(editTask.dueDate) : null);
        setNotifs(editTask.notifs || {});
      } else {
        setTitle('');
        setImportance(0);
        setDueDate(null);
        setNotifs({ before1: true });
      }
      setShowCal(false);
    }
  }, [visible, editTask]);

  const reset = () => {
    setTitle('');
    setImportance(0);
    setDueDate(null);
    setNotifs({});
    setShowCal(false);
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Entre un titre pour la tâche.');
      return;
    }

    const dueDateStr = dueDate
      ? `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`
      : null;

    const task = {
      id: editTask ? editTask.id : Date.now().toString(),
      subject,
      title: title.trim(),
      importance,
      dueDate: dueDateStr,
      notifs: dueDate ? notifs : {},
      done: editTask ? editTask.done : false,
      doneAt: editTask ? editTask.doneAt : null,
      createdAt: editTask ? editTask.createdAt : new Date().toISOString(),
    };

    onSave(task);
    reset();
    onClose();
  };

  const toggleNotif = (key) => setNotifs(n => ({ ...n, [key]: !n[key] }));

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={() => { reset(); onClose(); }} />
      <div className="modal-card">
        <div className="modal-color-bar" style={{ backgroundColor: subjectColor }} />
        <div className="modal-content">
          <div className="task-modal-header">
            <h2 className="modal-title">{editTask ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
            <div className="subject-label">{subject}</div>
          </div>
          <div className="modal-divider" />

          <label className="form-label">Titre</label>
          <textarea
            className="text-input"
            rows="2"
            placeholder="Description de la tâche..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className="form-label">Importance</label>
          <div className="importance-row">
            {IMPORTANCE_COLORS.map((color, idx) => (
              <button
                key={idx}
                type="button"
                className={`imp-btn ${importance === idx ? 'imp-btn-selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setImportance(idx)}
              >
                {IMPORTANCE_LABELS[idx]}
              </button>
            ))}
          </div>

          <div className="date-row-header">
            <label className="form-label" style={{ marginBottom: 0 }}>Date d'échéance</label>
            {dueDate && (
              <button
                type="button"
                className="clear-date-btn"
                onClick={() => { setDueDate(null); setNotifs({}); }}
              >
                ✕ Effacer
              </button>
            )}
          </div>
          <button
            type="button"
            className="date-selector-btn"
            onClick={() => setShowCal(!showCal)}
          >
            <span>{dueDate ? format(new Date(dueDate), 'd MMMM yyyy', { locale: fr }) : 'Sans date'}</span>
            <span style={{ color: '#8E8E93' }}>{showCal ? '▲' : '▼'}</span>
          </button>

          {showCal && (
            <MiniCalendar
              selectedDate={dueDate}
              onSelectDate={(d) => { setDueDate(d); setShowCal(false); }}
            />
          )}

          {dueDate && (
            <div className="notifs-section">
              <label className="form-label">Notifications</label>
              {TASK_NOTIF_OPTIONS.map(opt => (
                <div
                  key={opt.key}
                  className="notif-row"
                  onClick={() => toggleNotif(opt.key)}
                >
                  <div className={`checkbox ${notifs[opt.key] ? 'checkbox-on' : ''}`}>
                    {notifs[opt.key] && <span className="checkmark">✓</span>}
                  </div>
                  <span className="notif-label">{opt.label}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="save-btn"
            style={{ backgroundColor: subjectColor }}
            onClick={handleSave}
          >
            {editTask ? 'Enregistrer les modifications' : 'Ajouter la tâche'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default TaskModal;
