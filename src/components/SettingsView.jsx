import React from 'react';

export const SettingsView = ({
  tempUrl,
  setTempUrl,
  loading,
  onSync,
  notify30,
  setNotify30,
  notify10,
  setNotify10,
  hideWeekends,
  setHideWeekends,
  detailMode,
  setDetailMode,
  fontScale,
  setFontScale,
  onSave,
  hasExistingIcs,
  onBackToCalendar
}) => {
  return (
    <div className="config-container">
      <div className="config-header-row">
        <h1 className="config-title">Agenda</h1>
        {hasExistingIcs && (
          <button
            type="button"
            className="back-cal-btn"
            onClick={onBackToCalendar}
          >
            ← Retour au calendrier
          </button>
        )}
      </div>

      <div className="section-card">
        <label className="settings-label">🔗 Lien calendrier (.ics)</label>
        <input
          type="text"
          className="text-input"
          placeholder="Coller le lien ici (ex: https://.../calendar.ics)"
          value={tempUrl}
          onChange={(e) => setTempUrl(e.target.value)}
        />
        <button
          type="button"
          className="change-btn"
          disabled={loading}
          onClick={onSync}
        >
          {loading ? 'Synchronisation en cours...' : 'Synchroniser'}
        </button>
      </div>

      <div className="section-card">
        <label className="settings-label">🔔 Notifications de cours</label>
        <div className="switch-row">
          <span className="settings-label" style={{ marginBottom: 0, fontWeight: 500 }}>
            30 min avant
          </span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notify30}
              onChange={(e) => setNotify30(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
        <div className="switch-row">
          <span className="settings-label" style={{ marginBottom: 0, fontWeight: 500 }}>
            10 min avant
          </span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notify10}
              onChange={(e) => setNotify10(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
      </div>

      <div className="section-card">
        <div className="switch-row">
          <span className="settings-label" style={{ marginBottom: 0, fontWeight: 500 }}>
            📅 Cacher les week-ends
          </span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={hideWeekends}
              onChange={(e) => setHideWeekends(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="switch-row">
          <span className="settings-label" style={{ marginBottom: 0, fontWeight: 500 }}>
            🔍 Mode détail en vue jour
          </span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={detailMode}
              onChange={(e) => setDetailMode(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>

        <label className="settings-label">📏 Taille du texte</label>
        <div className="font-stepper-row">
          <button
            type="button"
            className="stepper-btn"
            onClick={() => setFontScale(s => Math.max(0.7, parseFloat((s - 0.05).toFixed(2))))}
          >
            −
          </button>
          <span className="stepper-value">{fontScale.toFixed(2)}x</span>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => setFontScale(s => Math.min(2.0, parseFloat((s + 0.05).toFixed(2))))}
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        className="save-btn"
        style={{ backgroundColor: '#34C759', padding: '16px' }}
        onClick={onSave}
      >
        💾 Enregistrer les réglages
      </button>
    </div>
  );
};
export default SettingsView;
