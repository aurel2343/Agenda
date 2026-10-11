import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { IMPORTANCE_COLORS, parseDueDate } from './TaskModal';

export const DayTasksModal = ({
  day,
  tasks,
  knownSubjects,
  onClose,
  onToggleTask,
  onDeleteTask,
  onEditTask,
}) => {
  if (!day) return null;

  const dayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  const dayTasks = tasks
    .filter(t => t.dueDate === dayStr)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return b.importance - a.importance;
    });

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card">
        <div className="modal-color-bar" style={{ backgroundColor: '#FF3B30' }} />
        <div className="modal-content">
          <div className="modal-header-actions">
            <h2 className="modal-title" style={{ margin: 0 }}>
              📅 {format(day, 'EEEE d MMMM', { locale: fr })}
            </h2>
            <button type="button" className="close-icon-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="modal-scroll-area">
            {dayTasks.length === 0 ? (
              <div className="no-tasks" style={{ marginTop: '30px' }}>
                Aucune tâche pour ce jour
              </div>
            ) : (
              dayTasks.map(task => {
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
export default DayTasksModal;
