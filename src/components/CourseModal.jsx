import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { extractSubject } from '../utils/icsParser';
import { IMPORTANCE_COLORS, IMPORTANCE_LABELS, parseDueDate } from './TaskModal';

export const CourseModal = ({ course, tasks, onClose, onAddTask, onToggleTask, onDeleteTask, onEditTask }) => {
  if (!course) return null;

  const subject = extractSubject(course.title);
  const courseTasks = tasks
    .filter(t => t.subject === subject)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return b.importance - a.importance;
    });

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card">
        <div className="modal-color-bar" style={{ backgroundColor: course.color }} />
        <div className="modal-content">
          <h2 className="modal-title">{course.title}</h2>
          <div className="modal-divider" />

          <div className="modal-row">
            <span className="modal-icon">📅</span>
            <span className="modal-text">{format(course.start, 'EEEE d MMMM yyyy', { locale: fr })}</span>
          </div>
          <div className="modal-row">
            <span className="modal-icon">🕒</span>
            <span className="modal-text">{format(course.start, 'HH:mm')} – {format(course.end, 'HH:mm')}</span>
          </div>
          <div className="modal-row">
            <span className="modal-icon">⏱</span>
            <span className="modal-text">{Math.round((course.end - course.start) / 60000)} minutes</span>
          </div>
          <div className="modal-row">
            <span className="modal-icon">📍</span>
            <span className="modal-text">{course.location}</span>
          </div>
          {course.formateurs?.length > 0 && (
            <div className="modal-row">
              <span className="modal-icon">👨‍🏫</span>
              <span className="modal-text">{course.formateurs.join(', ')}</span>
            </div>
          )}

          <div className="modal-divider" />

          <div className="task-header-row">
            <span className="task-header-text">📝 {subject}</span>
            <button
              type="button"
              className="add-task-btn"
              style={{ backgroundColor: course.color }}
              onClick={onAddTask}
            >
              + Ajouter
            </button>
          </div>

          {courseTasks.length === 0 && (
            <div className="no-tasks">Aucune tâche pour cette matière</div>
          )}

          <div className="task-list">
            {courseTasks.map(task => (
              <div
                key={task.id}
                className={`task-item ${task.done ? 'task-item-done' : ''}`}
              >
                <button
                  type="button"
                  className="task-check"
                  style={{
                    borderColor: IMPORTANCE_COLORS[task.importance],
                    backgroundColor: task.done ? IMPORTANCE_COLORS[task.importance] : 'transparent'
                  }}
                  onClick={() => onToggleTask(task.id)}
                >
                  {task.done && <span className="task-checkmark">✓</span>}
                </button>

                <div className="task-body" onClick={() => onEditTask(task)}>
                  <span className={`task-title ${task.done ? 'task-title-done' : ''}`}>
                    {task.title}
                  </span>
                  <div className="task-meta">
                    <span
                      className="task-imp-badge"
                      style={{ backgroundColor: IMPORTANCE_COLORS[task.importance] }}
                    >
                      {IMPORTANCE_LABELS[task.importance]}
                    </span>
                    {task.dueDate && parseDueDate(task.dueDate) && (
                      <span className="task-due">
                        📅 {format(parseDueDate(task.dueDate), 'd MMM', { locale: fr })}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="task-delete-btn"
                  onClick={() => onDeleteTask(task.id)}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="modal-close-btn"
            style={{ backgroundColor: course.color }}
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
export default CourseModal;
