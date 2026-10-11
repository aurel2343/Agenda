import React from 'react';

export const SubjectPickerModal = ({
  visible,
  knownSubjects,
  tasks,
  onClose,
  onSelectSubject,
  onOpenAllTasks,
  onOpenCustomCategory,
}) => {
  if (!visible) return null;

  const courseSubjects = new Set(knownSubjects.map(s => s.name));
  const customSubjects = [
    ...new Set(
      tasks
        .filter(t => !t.done && !courseSubjects.has(t.subject))
        .map(t => t.subject)
    ),
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card modal-card-tall">
        <div className="modal-color-bar" style={{ backgroundColor: '#007AFF' }} />
        <div className="modal-content">
          <div className="modal-header-actions">
            <h2 className="modal-title" style={{ margin: 0 }}>Choisir une matière</h2>
            <button
              type="button"
              className="text-link-btn"
              onClick={onOpenAllTasks}
            >
              Toutes les tâches →
            </button>
          </div>

          <div className="modal-scroll-area">
            {knownSubjects.length === 0 && (
              <div className="no-tasks">
                Aucune matière disponible.<br />Synchronise d'abord ton emploi du temps.
              </div>
            )}

            {knownSubjects.map(({ name, color }) => {
              const pendingCount = tasks.filter(t => t.subject === name && !t.done).length;
              return (
                <div
                  key={name}
                  className="subject-picker-item"
                  style={{ borderLeftColor: color }}
                  onClick={() => onSelectSubject(name, color)}
                >
                  <div className="subject-dot" style={{ backgroundColor: color }} />
                  <span className="subject-name">{name}</span>
                  <span className="subject-count">{pendingCount} tâche(s)</span>
                </div>
              );
            })}

            {customSubjects.map(name => {
              const pendingCount = tasks.filter(t => t.subject === name && !t.done).length;
              return (
                <div
                  key={name}
                  className="subject-picker-item"
                  style={{ borderLeftColor: '#8E8E93' }}
                  onClick={() => onSelectSubject(name, '#8E8E93')}
                >
                  <div className="subject-dot" style={{ backgroundColor: '#8E8E93' }} />
                  <span className="subject-name">{name}</span>
                  <span className="subject-count">{pendingCount} tâche(s)</span>
                </div>
              );
            })}

            <div
              className="subject-picker-item subject-picker-dashed"
              onClick={onOpenCustomCategory}
            >
              <div className="subject-dot" style={{ backgroundColor: '#C7C7CC' }} />
              <span className="subject-name" style={{ color: '#8E8E93' }}>
                ＋ Nouvelle catégorie...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SubjectPickerModal;
