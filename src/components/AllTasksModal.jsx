import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { IMPORTANCE_COLORS, parseDueDate } from './TaskModal';

export const AllTasksModal = ({
  visible,
  tasks,
  knownSubjects,
  onClose,
  onToggleTask,
  onDeleteTask,
  onEditTask,
}) => {
  if (!visible) return null;

  const activeTasks = tasks
    .filter(t => !t.done)
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        const diff = new Date(a.dueDate) - new Date(b.dueDate);
        if (diff !== 0) return diff;
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return b.importance - a.importance;
    });
  const doneTasks = tasks.filter(t => t.done);
  const allSorted = [...activeTasks, ...doneTasks];

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card modal-card-tall">
        <div className="modal-color-bar" style={{ backgroundColor: '#5856D6' }} />
        <div className="modal-content">
          <div className="modal-header-actions">
            <h2 className="modal-title" style={{ margin: 0 }}>📋 Toutes les tâches</h2>
            <button
              type="button"
              className="close-icon-btn"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="modal-scroll-area">
            {allSorted.length === 0 ? (
              <div className="no-tasks" style={{ marginTop: '30px' }}>
                Aucune tâche pour l'instant
              </div>
            ) : (
              allSorted.map(task => {
                const subjectColor =
                  knownSubjects.find(s => s.name === task.subject)?.color || '#8E8E93';

                return (
                  <div
                    key={task.id}
                    className={`task-item ${task.done ? 'task-item-done' : ''}`}
                  >
                    <button
                      type="button"
                      className="task-check"
                      style={{
                        borderColor: IMPORTANCE_COLORS[task.importance],
                        backgroundColor: task.done ? IMPORTANCE_COLORS[task.importance] : 'transparent',
                      }}
                      onClick={() => onToggleTask(task.id)}
                    >
                      {task.done && <span className="task-checkmark">✓</span>}
                    </button>

                    <div
                      className="task-body"
                      onClick={() => onEditTask(task, subjectColor)}
                    >
                      <span className={`task-title ${task.done ? 'task-title-done' : ''}`}>
                        {task.title}
                      </span>
                      <div className="task-meta">
                        <span
                          className="task-imp-badge"
                          style={{ backgroundColor: subjectColor }}
                        >
                          {task.subject}
                        </span>
                        {task.dueDate && parseDueDate(task.dueDate) && (
                          <span className="task-due">
                            📅 {format(parseDueDate(task.dueDate), 'd MMM', { locale: fr })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="importance-dot"
                      style={{ backgroundColor: IMPORTANCE_COLORS[task.importance] }}
                    />

                    <button
                      type="button"
                      className="task-delete-btn"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      🗑
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AllTasksModal;
