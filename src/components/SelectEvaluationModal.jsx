import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function SelectEvaluationModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [standorte, setStandorte] = useState([]);
  const [studiengaenge, setStudiengaenge] = useState([]);
  const [semesterList, setSemesterList] = useState([]);
  const [moduleList, setModuleList] = useState([]);

  const [selectedStandortId, setSelectedStandortId] = useState('');
  const [selectedAbschluss, setSelectedAbschluss] = useState('');
  const [selectedStudiengangId, setSelectedStudiengangId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [selectedModulId, setSelectedModulId] = useState('');

  const [loadingStandorte, setLoadingStandorte] = useState(false);
  const [loadingStudiengaenge, setLoadingStudiengaenge] = useState(false);
  const [loadingSemester, setLoadingSemester] = useState(false);
  const [loadingModule, setLoadingModule] = useState(false);
  const [error, setError] = useState(null);

  function resetSelections() {
    setSelectedStandortId('');
    setSelectedAbschluss('');
    setSelectedStudiengangId('');
    setSelectedSemesterId('');
    setSelectedModulId('');
    setStudiengaenge([]);
    setSemesterList([]);
    setModuleList([]);
    setError(null);
  }

  function handleClose() {
    resetSelections();
    if (onClose) onClose();
  }

  function handleSelectStandort(id) {
    setSelectedStandortId(id);
    setSelectedStudiengangId('');
    setSelectedSemesterId('');
    setSelectedModulId('');
    setStudiengaenge([]);
    setSemesterList([]);
    setModuleList([]);
    setError(null);
  }

  function handleSelectAbschluss(value) {
    setSelectedAbschluss(value);
    setSelectedStudiengangId('');
    setSelectedSemesterId('');
    setSelectedModulId('');
    setStudiengaenge([]);
    setSemesterList([]);
    setModuleList([]);
    setError(null);
  }

  function handleSelectStudiengang(id) {
    setSelectedStudiengangId(id);
    setSelectedSemesterId('');
    setSelectedModulId('');
    setSemesterList([]);
    setModuleList([]);
    setError(null);
  }

  function handleSelectSemester(id) {
    setSelectedSemesterId(id);
    setSelectedModulId('');
    setModuleList([]);
    setError(null);
  }

  function handleSelectModul(id) {
    setSelectedModulId(id);
  }

  function handleGoToEvaluations() {
    if (!selectedModulId) return;
    handleClose();
    navigate(`/evaluations/${selectedModulId}`);
  }

  useEffect(() => {
    if (!isOpen) return;
    if (standorte.length > 0) return;

    let active = true;
    setLoadingStandorte(true);
    setError(null);

    (async () => {
      const { data, error } = await supabase
        .from('standort')
        .select('id, name')
        .order('name', { ascending: true });

      if (!active) return;
      if (error) setError(error.message);
      setStandorte(data || []);
      setLoadingStandorte(false);
    })();

    return () => {
      active = false;
    };
  }, [isOpen, standorte.length]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedStandortId || !selectedAbschluss) {
      setStudiengaenge([]);
      setLoadingStudiengaenge(false);
      return;
    }

    let active = true;
    setLoadingStudiengaenge(true);
    setError(null);

    (async () => {
      const { data, error } = await supabase
        .from('studiengang')
        .select('id, name, standort_id')
        .eq('standort_id', selectedStandortId)
        .eq('abschluss', selectedAbschluss)
        .order('name', { ascending: true });

      if (!active) return;
      if (error) setError(error.message);
      setStudiengaenge(data || []);
      setLoadingStudiengaenge(false);
    })();

    return () => {
      active = false;
    };
  }, [isOpen, selectedStandortId, selectedAbschluss]);

  useEffect(() => {
    if (!isOpen) return;
    if (semesterList.length > 0) return;

    let active = true;
    setLoadingSemester(true);
    setError(null);

    (async () => {
      const { data, error } = await supabase
        .from('semester')
        .select('id, nummer, bezeichnung')
        .order('nummer', { ascending: true });

      if (!active) return;
      if (error) setError(error.message);
      setSemesterList(data || []);
      setLoadingSemester(false);
    })();

    return () => {
      active = false;
    };
  }, [isOpen, semesterList.length]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedStudiengangId || !selectedSemesterId) {
      setModuleList([]);
      setLoadingModule(false);
      setSelectedModulId('');
      return;
    }

    let active = true;
    setLoadingModule(true);
    setError(null);

    (async () => {
      const { data, error } = await supabase
        .from('modul')
        .select('id, name, kuerzel, professor, semester_id, studiengang_id')
        .eq('semester_id', selectedSemesterId)
        .eq('studiengang_id', selectedStudiengangId)
        .order('name', { ascending: true });

      if (!active) return;
      if (error) setError(error.message);
      setModuleList(data || []);
      setLoadingModule(false);
    })();

    return () => {
      active = false;
    };
  }, [isOpen, selectedSemesterId, selectedStudiengangId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={handleClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
        <span className="bubble bubble--mint bubble--sm">Auswahl</span>
        <h3>Evaluationen ansehen</h3>
        <p className="muted">Standort, Abschluss, Studiengang, Semester und Modul auswählen.</p>

        {error && <p className="error-text">Fehler: {error}</p>}

        <div className="form-grid">
          <select
            className="select"
            value={selectedStandortId}
            onChange={event => handleSelectStandort(event.target.value)}
          >
            <option value="">{loadingStandorte ? 'Lade Standorte...' : 'Standort wählen'}</option>
            {standorte.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>

          <select
            className="select"
            value={selectedAbschluss}
            onChange={event => handleSelectAbschluss(event.target.value)}
            disabled={!selectedStandortId}
          >
            <option value="">{selectedStandortId ? 'Abschluss wählen' : 'Bitte erst Standort wählen'}</option>
            <option value="Bachelor">Bachelor</option>
            <option value="Master">Master</option>
          </select>

          <select
            className="select"
            value={selectedStudiengangId}
            onChange={event => handleSelectStudiengang(event.target.value)}
            disabled={!selectedStandortId || !selectedAbschluss || loadingStudiengaenge}
          >
            <option value="">
              {!selectedStandortId
                ? 'Bitte erst Standort wählen'
                : (!selectedAbschluss
                  ? 'Bitte erst Abschluss wählen'
                  : (loadingStudiengaenge ? 'Lade Studiengänge...' : 'Studiengang wählen'))}
            </option>
            {studiengaenge.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>

          <select
            className="select"
            value={selectedSemesterId}
            onChange={event => handleSelectSemester(event.target.value)}
            disabled={!selectedStudiengangId || loadingSemester}
          >
            <option value="">
              {!selectedStudiengangId
                ? 'Bitte erst Studiengang wählen'
                : (loadingSemester ? 'Lade Semester...' : 'Semester wählen')}
            </option>
            {semesterList.map(item => (
              <option key={item.id} value={item.id}>
                Semester {item.nummer}{item.bezeichnung ? ` - ${item.bezeichnung}` : ''}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={selectedModulId}
            onChange={event => handleSelectModul(event.target.value)}
            disabled={!selectedSemesterId || loadingModule}
          >
            <option value="">
              {!selectedSemesterId
                ? 'Bitte erst Semester wählen'
                : (loadingModule ? 'Lade Module...' : 'Modul wählen')}
            </option>
            {moduleList.map(item => (
              <option key={item.id} value={item.id}>
                {item.name}{item.professor ? ` - ${item.professor}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="modal__footer">
          <button type="button" className="button secondary" onClick={handleClose}>
            Schliessen
          </button>
          <button type="button" className="button" onClick={handleGoToEvaluations} disabled={!selectedModulId}>
            Ansehen
          </button>
        </div>
      </div>
    </div>
  );
}
