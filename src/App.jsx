import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  format,
  addDays,
  subDays,
  isSameDay,
  startOfWeek,
  addWeeks,
  subWeeks,
  isWeekend,
  nextMonday,
} from 'date-fns';
import { fr } from 'date-fns/locale';

import AsyncStorage from './utils/storage';
import {
  fetchIcsRaw,
  parseIcsData,
  extractSubject,
} from './utils/icsParser';
import {
  requestNotificationPermission,
  cancelAllCourseNotifications,
  cancelAllTaskNotifications,
  scheduleWebNotification,
} from './utils/notifications';

import MiniCalendar from './components/MiniCalendar';
import TaskModal, { parseDueDate, TASK_NOTIF_OPTIONS } from './components/TaskModal';
import CourseModal from './components/CourseModal';
import SubjectPickerModal from './components/SubjectPickerModal';
import CustomCategoryModal from './components/CustomCategoryModal';
import AllTasksModal from './components/AllTasksModal';
import DayTasksModal from './components/DayTasksModal';
import SettingsView from './components/SettingsView';

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const TOTAL_HOURS = DAY_END_HOUR - DAY_START_HOUR;
const WEEK_HEADER_HEIGHT = 48;
const BASE_HOUR_HEIGHT = 65; // Hauteur par défaut d'une heure dans la grille web

const permitBrutalBreak = (text) => {
  if (!text) return '';
  return text.split('').join('\u200B');
};

export default function App() {
  const horizontalScrollRef = useRef(null);
  const verticalScrollRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const savingTaskRef = useRef(false);

  // États applicatifs
  const [icsUrl, setIcsUrl] = useState(null);
  const [tempUrl, setTempUrl] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [viewMode, setViewMode] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notify30, setNotify30] = useState(true);
  const [notify10, setNotify10] = useState(true);
  const [hideWeekends, setHideWeekends] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [detailMode, setDetailMode] = useState(false);

  // Modals et sélections
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalSubject, setTaskModalSubject] = useState('');
  const [taskModalColor, setTaskModalColor] = useState('#007AFF');
  const [editingTask, setEditingTask] = useState(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showDayTasks, setShowDayTasks] = useState(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // Initialisation et permissions
  useEffect(() => {
    initApp();
  }, []);

  // Nettoyage automatique des tâches terminées > 12h
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTasks(prev => {
        const filtered = prev.filter(t =>
          !t.done || !t.doneAt || (now - new Date(t.doneAt).getTime()) < 12 * 3600 * 1000
        );
        if (filtered.length !== prev.length) {
          AsyncStorage.setItem('@tasks', JSON.stringify(filtered));
        }
        return filtered;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const initApp = async () => {
    requestNotificationPermission();

    const storedUrl = await AsyncStorage.getItem('@ics_url');
    const n30 = await AsyncStorage.getItem('@notify_30');
    const n10 = await AsyncStorage.getItem('@notify_10');
    const hw = await AsyncStorage.getItem('@hide_weekends');
    const scale = await AsyncStorage.getItem('@font_scale');
    const dm = await AsyncStorage.getItem('@detail_mode');
    const storedTasks = await AsyncStorage.getItem('@tasks');

    if (n30 !== null) setNotify30(JSON.parse(n30));
    if (n10 !== null) setNotify10(JSON.parse(n10));
    if (hw !== null) setHideWeekends(JSON.parse(hw));
    if (scale !== null) setFontScale(JSON.parse(scale));
    if (dm !== null) setDetailMode(JSON.parse(dm));

    if (storedTasks) {
      const parsed = JSON.parse(storedTasks);
      const now = Date.now();
      const filtered = parsed.filter(t =>
        !t.done || !t.doneAt || (now - new Date(t.doneAt).getTime()) < 12 * 3600 * 1000
      );
      setTasks(filtered);
    }

    if (storedUrl) {
      setIcsUrl(storedUrl);
      setTempUrl(storedUrl);
      initData(storedUrl);
    }
  };

  const initData = async (url) => {
    const storedData = await AsyncStorage.getItem('@courses_cache');
    const storedTime = await AsyncStorage.getItem('@last_update');
    if (storedData) {
      const parsed = JSON.parse(storedData).map(c => ({
        ...c,
        start: new Date(c.start),
        end: new Date(c.end),
      }));
      setCourses(parsed);
      setLastUpdate(storedTime);
    }
    loadData(url, true);
  };

  const loadData = async (url, isBackground = false) => {
    if (!url) return false;
    if (!isBackground) setLoading(true);
    let success = false;
    let fetched = [];

    try {
      const raw = await fetchIcsRaw(url);
      fetched = parseIcsData(raw);
      success = true;
    } catch (e) {
      console.error(e);
      success = false;
    }

    if (success) {
      const nowStr = format(new Date(), 'd MMM HH:mm', { locale: fr });
      setCourses(fetched);
      setLastUpdate(nowStr);
      await AsyncStorage.setItem('@courses_cache', JSON.stringify(fetched));
      await AsyncStorage.setItem('@last_update', nowStr);
      scheduleAllCoursesNotifications(fetched, notify30, notify10);
      if (!isBackground) alert('Emploi du temps synchronisé !');
    } else if (!isBackground) {
      alert('Erreur: Lien invalide ou serveurs proxy indisponibles.');
    }

    setLoading(false);
    return success;
  };

  // Gestion des notifications de cours
  const scheduleAllCoursesNotifications = (allCourses, n30, n10) => {
    cancelAllCourseNotifications();
    if (!n30 && !n10) return;

    const nowMs = Date.now();
    const futureCourses = allCourses
      .filter(c => c.start.getTime() > nowMs)
      .sort((a, b) => a.start - b.start)
      .slice(0, 20);

    const minutesList = [n30 ? 30 : null, n10 ? 10 : null].filter(Boolean);

    for (const c of futureCourses) {
      for (const m of minutesList) {
        const triggerDate = new Date(c.start.getTime() - m * 60 * 1000);
        scheduleWebNotification(
          `cours_${c.id}_${m}`,
          `Cours dans ${m} min 🎓`,
          {
            body: `${c.title}\n📍 ${c.location} • 🕒 ${format(c.start, 'HH:mm')} - ${format(c.end, 'HH:mm')}`,
          },
          triggerDate
        );
      }
    }
  };

  // Gestion des notifications de tâches
  const scheduleTaskNotifications = (task) => {
    if (!task.dueDate || !task.notifs || task.done) return;
    const parts = task.dueDate.substring(0, 10).split('-').map(Number);
    const [dueYear, dueMonth, dueDay] = parts;

    for (const opt of TASK_NOTIF_OPTIONS) {
      if (!task.notifs[opt.key]) continue;
      const triggerDate = new Date(dueYear, dueMonth - 1, dueDay - opt.offsetDays, opt.hour, 0, 0, 0);
      scheduleWebNotification(
        `task_${task.id}_${opt.key}`,
        '📝 Tâche à rendre',
        { body: `${task.subject} — ${task.title}` },
        triggerDate
      );
    }
  };

  // Sauvegarde des tâches
  const saveTasks = async (newTasks) => {
    setTasks(newTasks);
    await AsyncStorage.setItem('@tasks', JSON.stringify(newTasks));
  };

  const handleAddTask = async (task) => {
    if (savingTaskRef.current) return;
    savingTaskRef.current = true;
    try {
      if (editingTask) {
        await saveTasks(tasks.map(t => (t.id === task.id ? task : t)));
      } else {
        await saveTasks([...tasks, task]);
      }
      scheduleTaskNotifications(task);
      setEditingTask(null);
    } finally {
      savingTaskRef.current = false;
    }
  };

  const handleToggleTask = async (taskId) => {
    const now = new Date().toISOString();
    await saveTasks(
      tasks.map(t =>
        t.id === taskId
          ? { ...t, done: !t.done, doneAt: !t.done ? now : null }
          : t
      )
    );
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Supprimer cette tâche ?')) {
      saveTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  // Liste des matières uniques pour le sélecteur
  const knownSubjects = useMemo(() => {
    const map = new Map();
    for (const c of courses) {
      if (c.isExam) continue;
      const s = extractSubject(c.title);
      if (!map.has(s)) map.set(s, c.color);
    }
    return Array.from(map.entries()).map(([name, color]) => ({ name, color }));
  }, [courses]);

  // Jours affichés
  const { daysToDisplay, columnWidth } = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    let days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));

    if (hideWeekends) {
      const hasSat = courses.some(c => isSameDay(c.start, days[5]));
      const hasSun = courses.some(c => isSameDay(c.start, days[6]));
      if (!hasSat && !hasSun) days = days.slice(0, 5);
      else if (hasSat && !hasSun) days = days.slice(0, 6);
    }

    return {
      daysToDisplay: days,
      columnWidth: viewMode === 'week' ? 140 : '100%',
    };
  }, [selectedDate, hideWeekends, courses, viewMode]);

  // Auto-scroll vertical vers le 1er cours
  useEffect(() => {
    if (viewMode !== 'day') return;
    const dayCourses = courses
      .filter(c => isSameDay(c.start, selectedDate))
      .sort((a, b) => a.start - b.start);

    let targetHour;
    if (dayCourses.length > 0) {
      targetHour = dayCourses[0].start.getHours() + dayCourses[0].start.getMinutes() / 60;
    } else {
      const now = new Date();
      targetHour = now.getHours() + now.getMinutes() / 60;
    }

    const hh = (viewMode === 'day' && detailMode) ? BASE_HOUR_HEIGHT * 1.5 : BASE_HOUR_HEIGHT;
    const scrollY = Math.max(0, (targetHour - DAY_START_HOUR - 0.5) * hh);
    setTimeout(() => {
      verticalScrollRef.current?.scrollTo({ top: scrollY, behavior: 'smooth' });
    }, 150);
  }, [selectedDate, viewMode, courses, detailMode]);

  // Navigation
  const handleNext = () => {
    let n = viewMode === 'day' ? addDays(selectedDate, 1) : addWeeks(selectedDate, 1);
    if (viewMode === 'day' && hideWeekends) {
      while (isWeekend(n) && !courses.some(c => isSameDay(c.start, n))) n = addDays(n, 1);
    }
    setSelectedDate(n);
  };

  const handlePrev = () => {
    let p = viewMode === 'day' ? subDays(selectedDate, 1) : subWeeks(selectedDate, 1);
    if (viewMode === 'day' && hideWeekends) {
      while (isWeekend(p) && !courses.some(c => isSameDay(c.start, p))) p = subDays(p, 1);
    }
    setSelectedDate(p);
  };

  const jumpToToday = () => {
    let t = new Date();
    if (hideWeekends && isWeekend(t) && !courses.some(c => isSameDay(c.start, t))) {
      t = nextMonday(t);
    }
    setSelectedDate(t);
  };

  const switchToDayView = (day) => {
    setSelectedDate(day);
    setViewMode('day');
  };

  // Gestion des gestes tactiles (swipe gauche/droite pour changer de jour)
  const handleTouchStart = (e) => {
    if (viewMode !== 'day') return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (viewMode !== 'day' || touchStartXRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) handlePrev();
      else handleNext();
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const hourHeight = (viewMode === 'day' && detailMode) ? BASE_HOUR_HEIGHT * 1.5 : BASE_HOUR_HEIGHT;

  // Rendu d'un bloc de cours
  const renderCourseBlock = (course) => {
    const startMins = course.start.getHours() * 60 + course.start.getMinutes();
    const endMins = course.end.getHours() * 60 + course.end.getMinutes();
    const top = ((startMins - DAY_START_HOUR * 60) / 60) * hourHeight;
    const baseHeight = Math.max(((endMins - startMins) / 60) * hourHeight, 38);

    const isWeek = viewMode === 'week';
    const titleSize = (isWeek ? 10 : 12) * fontScale;
    const infoSize = (isWeek ? 9 : 10) * fontScale;
    const subject = extractSubject(course.title);
    const taskCount = tasks.filter(t => t.subject === subject && !t.done).length;

    const detailTasks = (!isWeek && detailMode) ? (() => {
      const today = selectedDate;
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const courseTasks = tasks.filter(t => t.subject === subject && !t.done);
      const todayTasks = courseTasks.filter(t => t.dueDate === todayStr).sort((a, b) => b.importance - a.importance);
      const otherTasks = courseTasks.filter(t => t.dueDate !== todayStr).sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          const d = a.dueDate.localeCompare(b.dueDate);
          if (d !== 0) return d;
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        return b.importance - a.importance;
      });
      return [...todayTasks, ...otherTasks].slice(0, 2);
    })() : [];

    const height = detailTasks.length > 0
      ? Math.max(baseHeight, 32 + detailTasks.length * 28 + 24)
      : baseHeight;

    const words = course.title.split(' ');
    let l1 = '', l2 = '';
    for (let i = 0; i < words.length; i++) {
      if ((l1 + words[i]).length <= 22) l1 += (l1 === '' ? '' : ' ') + words[i];
      else { l2 = words.slice(i).join(' '); break; }
    }

    return (
      <div
        key={course.id}
        className="course-block"
        style={{
          top: `${top}px`,
          height: `${height}px`,
          backgroundColor: course.color,
          padding: isWeek ? '3px 4px' : '6px 8px',
        }}
        onClick={() => setSelectedCourse(course)}
      >
        <div>
          <div className="course-time" style={{ fontSize: `${infoSize}px`, fontWeight: 'bold' }}>
            🕒 {format(course.start, 'HH:mm')}-{format(course.end, 'HH:mm')}
          </div>
          {isWeek ? (
            <div style={{ marginTop: '2px' }}>
              <div className="course-title" style={{ fontSize: `${titleSize}px` }}>{l1}</div>
              <div className="course-title" style={{ fontSize: `${titleSize}px` }}>{permitBrutalBreak(l2)}</div>
            </div>
          ) : (
            <div className="course-title" style={{ fontSize: `${titleSize}px`, marginTop: '2px' }}>
              {course.title}
            </div>
          )}

          {detailTasks.length > 0 && (
            <div className="detail-tasks-container">
              {detailTasks.map(t => (
                <div
                  key={t.id}
                  className="inline-task-row"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTaskModalSubject(t.subject);
                    setTaskModalColor(course.color);
                    setEditingTask(t);
                    setShowTaskModal(true);
                  }}
                >
                  <div
                    className={`inline-task-check ${t.done ? 'checked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleTask(t.id);
                    }}
                  >
                    {t.done && <div className="inline-task-check-inner" style={{ backgroundColor: course.color }} />}
                  </div>
                  <span className="inline-task-title" style={{ fontSize: `${10 * fontScale}px` }}>
                    {t.title}
                  </span>
                  {t.dueDate && parseDueDate(t.dueDate) && (
                    <span className="inline-task-due" style={{ fontSize: `${9 * fontScale}px` }}>
                      {format(parseDueDate(t.dueDate), 'd MMM', { locale: fr })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <div className="course-details" style={{ fontSize: `${infoSize}px`, fontWeight: 'bold' }}>
            📍 {course.location}
          </div>
          {taskCount > 0 && (
            <span className="task-badge-course" style={{ fontSize: `${10 * fontScale}px` }}>
              {taskCount}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Écran Réglages si pas d'ICS configuré ou si ouvert via l'engrenage
  if (!icsUrl) {
    return (
      <div className="app-wrapper">
        <SettingsView
          tempUrl={tempUrl}
          setTempUrl={setTempUrl}
          loading={loading}
          onSync={async () => {
            const ok = await loadData(tempUrl, false);
            if (ok) {
              setIcsUrl(tempUrl);
              await AsyncStorage.setItem('@ics_url', tempUrl);
            }
          }}
          notify30={notify30}
          setNotify30={async (v) => { setNotify30(v); await AsyncStorage.setItem('@notify_30', JSON.stringify(v)); }}
          notify10={notify10}
          setNotify10={async (v) => { setNotify10(v); await AsyncStorage.setItem('@notify_10', JSON.stringify(v)); }}
          hideWeekends={hideWeekends}
          setHideWeekends={async (v) => { setHideWeekends(v); await AsyncStorage.setItem('@hide_weekends', JSON.stringify(v)); }}
          detailMode={detailMode}
          setDetailMode={async (v) => { setDetailMode(v); await AsyncStorage.setItem('@detail_mode', JSON.stringify(v)); }}
          fontScale={fontScale}
          setFontScale={setFontScale}
          onSave={async () => {
            await AsyncStorage.setItem('@font_scale', JSON.stringify(fontScale));
            const stored = await AsyncStorage.getItem('@ics_url');
            if (stored) setIcsUrl(stored);
            else alert("Veuillez d'abord synchroniser un lien ICS.");
          }}
          hasExistingIcs={Boolean(courses.length)}
          onBackToCalendar={() => {
            AsyncStorage.getItem('@ics_url').then(u => u && setIcsUrl(u));
          }}
        />
      </div>
    );
  }

  // Vue principale
  const todayStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const currentDayTasksCount = tasks.filter(t => !t.done && t.dueDate === todayStr).length;

  return (
    <div className="app-wrapper">
      {/* NAVBAR */}
      <div className="nav-bar">
        <button
          type="button"
          className="nav-add-btn"
          onClick={() => setShowSubjectPicker(true)}
        >
          ＋
        </button>

        <div className="tabs-container">
          <button
            type="button"
            className={`tab-btn ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => setViewMode('day')}
          >
            Jour
          </button>
          <button
            type="button"
            className={`tab-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Semaine
          </button>
        </div>

        <button
          type="button"
          className="gear-btn"
          onClick={() => setIcsUrl(null)}
        >
          ⚙️
        </button>
      </div>

      {/* SOUS EN-TÊTE */}
      <div className="sub-header">
        <button type="button" className="arrow-btn" onClick={handlePrev}>‹</button>

        <div className="date-center-box" onClick={jumpToToday}>
          <div className="date-label">
            {viewMode === 'day'
              ? format(selectedDate, 'EEEE d MMMM', { locale: fr })
              : `Sem. du ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'd MMM', { locale: fr })} au ${format(addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6), 'd MMM', { locale: fr })}`}
          </div>
          {lastUpdate && <div className="update-text">Mis à jour : {lastUpdate}</div>}
        </div>

        {viewMode === 'day' && (
          <button
            type="button"
            className="day-task-badge-header"
            style={{ backgroundColor: currentDayTasksCount > 0 ? '#FF3B30' : '#C7C7CC' }}
            onClick={() => setShowDayTasks(selectedDate)}
          >
            {currentDayTasksCount}
          </button>
        )}

        <button type="button" className="arrow-btn" onClick={handleNext}>›</button>
      </div>

      {/* GRILLE HORAIRE */}
      <div
        className="calendar-viewport"
        ref={verticalScrollRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="grid-body"
          style={{
            height: `${(TOTAL_HOURS + 1) * hourHeight + (viewMode === 'week' ? WEEK_HEADER_HEIGHT : 0)}px`,
          }}
        >
          {/* Colonne des heures */}
          <div className="time-column">
            {viewMode === 'week' && <div style={{ height: `${WEEK_HEADER_HEIGHT}px` }} />}
            {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => (
              <div key={i} style={{ height: `${hourHeight}px` }}>
                <div className="time-label">{DAY_START_HOUR + i}:00</div>
              </div>
            ))}
          </div>

          {/* Grille des colonnes */}
          <div
            className="columns-scroll-area"
            ref={horizontalScrollRef}
            style={{ overflowX: viewMode === 'week' ? 'auto' : 'hidden' }}
          >
            {/* Header semaine */}
            {viewMode === 'week' && (
              <div className="week-header-row">
                {daysToDisplay.map((day, i) => {
                  const dayDateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                  const dCount = tasks.filter(t => !t.done && t.dueDate === dayDateStr).length;
                  return (
                    <div
                      key={i}
                      className={`day-header-cell ${isSameDay(day, new Date()) ? 'today' : ''}`}
                      style={{ width: columnWidth }}
                      onClick={() => dCount > 0 ? setShowDayTasks(day) : switchToDayView(day)}
                    >
                      <span className="day-header-text">{format(day, 'EEE d', { locale: fr })}</span>
                      {dCount > 0 && <span className="week-day-task-badge">{dCount}</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Colonnes cours */}
            <div className="days-columns-row">
              {daysToDisplay.map((day, i) => {
                if (viewMode === 'day' && !isSameDay(day, selectedDate)) return null;

                return (
                  <div
                    key={i}
                    className="day-column"
                    style={{
                      width: columnWidth,
                      height: `${TOTAL_HOURS * hourHeight}px`,
                    }}
                    onClick={() => {
                      if (viewMode === 'week') switchToDayView(day);
                    }}
                  >
                    {Array.from({ length: TOTAL_HOURS }).map((_, h) => (
                      <div key={h} className="grid-line" style={{ height: `${hourHeight}px` }} />
                    ))}
                    {courses.filter(c => isSameDay(c.start, day)).map(renderCourseBlock)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {selectedCourse && !showTaskModal && (
        <CourseModal
          course={selectedCourse}
          tasks={tasks}
          onClose={() => setSelectedCourse(null)}
          onAddTask={() => {
            setTaskModalSubject(extractSubject(selectedCourse.title));
            setTaskModalColor(selectedCourse.color);
            setEditingTask(null);
            setShowTaskModal(true);
          }}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onEditTask={(task) => {
            setTaskModalSubject(task.subject);
            setTaskModalColor(selectedCourse.color);
            setEditingTask(task);
            setShowTaskModal(true);
          }}
        />
      )}

      {showTaskModal && (
        <TaskModal
          visible={showTaskModal}
          subject={taskModalSubject}
          subjectColor={taskModalColor}
          editTask={editingTask}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSave={handleAddTask}
        />
      )}

      <SubjectPickerModal
        visible={showSubjectPicker}
        knownSubjects={knownSubjects}
        tasks={tasks}
        onClose={() => setShowSubjectPicker(false)}
        onSelectSubject={(name, color) => {
          setTaskModalSubject(name);
          setTaskModalColor(color);
          setEditingTask(null);
          setShowSubjectPicker(false);
          setShowTaskModal(true);
        }}
        onOpenAllTasks={() => {
          setShowSubjectPicker(false);
          setShowAllTasks(true);
        }}
        onOpenCustomCategory={() => {
          setShowSubjectPicker(false);
          setShowCustomCategory(true);
        }}
      />

      <CustomCategoryModal
        visible={showCustomCategory}
        onClose={() => setShowCustomCategory(false)}
        onSubmit={(name) => {
          setTaskModalSubject(name);
          setTaskModalColor('#8E8E93');
          setEditingTask(null);
          setShowCustomCategory(false);
          setShowTaskModal(true);
        }}
      />

      <AllTasksModal
        visible={showAllTasks}
        tasks={tasks}
        knownSubjects={knownSubjects}
        onClose={() => setShowAllTasks(false)}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
        onEditTask={(task, color) => {
          setTaskModalSubject(task.subject);
          setTaskModalColor(color);
          setEditingTask(task);
          setShowAllTasks(false);
          setShowTaskModal(true);
        }}
      />

      <DayTasksModal
        day={showDayTasks}
        tasks={tasks}
        knownSubjects={knownSubjects}
        onClose={() => setShowDayTasks(null)}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
        onEditTask={(task, color) => {
          setTaskModalSubject(task.subject);
          setTaskModalColor(color);
          setEditingTask(task);
          setShowDayTasks(null);
          setShowTaskModal(true);
        }}
      />
    </div>
  );
}