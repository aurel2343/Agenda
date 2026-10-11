import React, { useState } from 'react';

export const CustomCategoryModal = ({ visible, onClose, onSubmit }) => {
  const [name, setName] = useState('');

  if (!visible) return null;

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      alert('Veuillez entrer un nom pour la catégorie');
      return;
    }
    onSubmit(trimmed);
    setName('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card">
        <div className="modal-color-bar" style={{ backgroundColor: '#8E8E93' }} />
        <div className="modal-content">
          <h2 className="modal-title">Nouvelle catégorie</h2>
          <label className="form-label">Nom de la matière ou catégorie</label>
          <input
            type="text"
            className="text-input"
            autoFocus
            placeholder="Ex: Projet perso, Révisions..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
            }}
          />
          <button
            type="button"
            className="save-btn"
            style={{ backgroundColor: '#8E8E93' }}
            onClick={handleConfirm}
          >
            Continuer →
          </button>
        </div>
      </div>
    </div>
  );
};
export default CustomCategoryModal;
