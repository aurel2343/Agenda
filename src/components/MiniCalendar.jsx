/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AGENDA ESME — MiniCalendar.jsx
 * Composant de calendrier mensuel interactif inline.
 * Utilisé à l'intérieur du modal de création/édition de tâche (TaskModal)
 * pour sélectionner visuellement une date d'échéance.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { format, startOfMonth, getDaysInMonth, getDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * @param {Object} props
 * @param {Date|null} props.selectedDate - Date actuellement sélectionnée
 * @param {Function} props.onSelectDate - Callback appelé lors du clic sur un jour (reçoit l'objet Date)
 * @param {Array} [props.courses=[]] - Liste de tous les cours pour détecter les jours ayant cette matière
 * @param {string} [props.subject=''] - Nom de la matière concernée par la tâche
 */
export const MiniCalendar = ({ selectedDate, onSelectDate, courses = [], subject = '' }) => {
  // Mois actuellement affiché dans le calendrier (indépendant de la date sélectionnée)
  const [viewMonth, setViewMonth] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const today = new Date();

  // Premier jour du mois et nombre de jours total
  const firstDay = startOfMonth(viewMonth);
  const daysInMonth = getDaysInMonth(viewMonth);

  // Conversion de l'indice de jour de semaine en lundi = 0 (par défaut getDay() retourne dimanche = 0)
  let startDow = getDay(firstDay);
  startDow = startDow === 0 ? 6 : startDow - 1;

  // Construction de la grille de 7 colonnes : cases vides de décalage + jours du mois
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
  }

  return (
    <div className="cal-wrap">
      {/* En-tête : boutons de changement de mois et affichage du mois en cours */}
      <div className="cal-head">
        <button
          type="button"
          className="cal-arrow-btn"
          aria-label="Mois précédent"
          onClick={() => setViewMonth(m => {
            const n = new Date(m);
            n.setMonth(n.getMonth() - 1);
            return n;
          })}
        >
          ◀
        </button>
        <span className="cal-month">{format(viewMonth, 'MMMM yyyy', { locale: fr })}</span>
        <button
          type="button"
          className="cal-arrow-btn"
          aria-label="Mois suivant"
          onClick={() => setViewMonth(m => {
            const n = new Date(m);
            n.setMonth(n.getMonth() + 1);
            return n;
          })}
        >
          ▶
        </button>
      </div>

      {/* Ligne des jours de la semaine : L M M J V S D */}
      <div className="cal-dow-row">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <span key={i} className="cal-dow">{d}</span>
        ))}
      </div>

      {/* Grille des cellules du mois */}
      <div className="cal-grid">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="cal-cell" />;
          const isTod = isSameDay(day, today);
          const isSel = selectedDate && isSameDay(day, new Date(selectedDate));

          // Vérifie si un cours de la matière concernée a lieu ce jour précis
          const hasSubjectCourse = subject && courses.some(c => {
            const courseSub = c.title ? c.title.split('-').pop().trim() : '';
            return isSameDay(c.start, day) && (courseSub === subject || c.title.includes(subject));
          });

          return (
            <button
              key={i}
              type="button"
              className={`cal-cell ${isSel ? 'cal-cell-sel' : ''} ${isTod && !isSel ? 'cal-cell-today' : ''}`}
              onClick={() => onSelectDate(day)}
            >
              <span className={`cal-day-txt ${isSel ? 'cal-day-txt-sel' : ''} ${isTod && !isSel ? 'cal-day-txt-today' : ''}`}>
                {day.getDate()}
              </span>
              {/* Point indicateur : présent si la matière est enseignée ce jour-là */}
              {hasSubjectCourse && (
                <span className={`cal-subject-dot ${isSel ? 'cal-subject-dot-sel' : ''}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;


