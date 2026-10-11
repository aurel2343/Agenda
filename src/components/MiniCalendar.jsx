import React, { useState } from 'react';
import { format, startOfMonth, getDaysInMonth, getDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export const MiniCalendar = ({ selectedDate, onSelectDate }) => {
  const [viewMonth, setViewMonth] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const today = new Date();

  const firstDay = startOfMonth(viewMonth);
  const daysInMonth = getDaysInMonth(viewMonth);

  let startDow = getDay(firstDay);
  startDow = startDow === 0 ? 6 : startDow - 1;

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
  }

  return (
    <div className="cal-wrap">
      <div className="cal-head">
        <button
          type="button"
          className="cal-arrow-btn"
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
          onClick={() => setViewMonth(m => {
            const n = new Date(m);
            n.setMonth(n.getMonth() + 1);
            return n;
          })}
        >
          ▶
        </button>
      </div>

      <div className="cal-dow-row">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <span key={i} className="cal-dow">{d}</span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="cal-cell" />;
          const isTod = isSameDay(day, today);
          const isSel = selectedDate && isSameDay(day, new Date(selectedDate));
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
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default MiniCalendar;
