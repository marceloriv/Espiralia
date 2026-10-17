import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart2,
  BookOpen,
  CalendarPlus,
  Compass,
  Link as LinkIcon,
  ListPlus,
  Quote,
  Heart,
  Zap,
  Sparkles,
  CheckCircle,
  Car,
  Coffee,
  Moon,
  Star,
  Pin,
  Check,
  Clock,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import type { Profile, AgendaEvent, PlannerBlock, TodoItem, Area, ViewType } from '../types';
import { StorageService } from '../services/storage';
import { toLocalDateStr } from '../utils/localDate';
import { CATEGORY_COLORS, FILTER_LABELS, categoryOf, occursOn } from './agenda/eventMapping';
import { criticalTodos, dueLabel, greetingFor, isCritical, todayEventsSorted, computeAreaSummaries } from './dashboard/dashboardData';
import { TaskCompletionChart } from './charts/TaskCompletionChart';
import { CategoryDistributionChart } from './charts/CategoryDistributionChart';
import styles from './DashboardView.module.css';

interface DashboardViewProps {
  profile: Profile;
  onNavigate: (view: ViewType) => void;
  onOpenReflection?: () => void;
  onOpenLink?: () => void;
}

const longDateFormatter = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

const countLabel = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

const formatHeroDate = (date: Date): string => {
  const formatted = longDateFormatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  onNavigate,
  onOpenReflection,
  onOpenLink,
}) => {
  const [events, setEvents] = useState<AgendaEvent[]>(() => StorageService.getEvents(profile.id));
  const [planner, setPlanner] = useState<PlannerBlock[]>(() => StorageService.getPlanner(profile.id));
  const [todos, setTodos] = useState<TodoItem[]>(() => StorageService.getTodos(profile.id));
  const [areas, setAreas] = useState<Area[]>(() => StorageService.getAreas(profile.id));
  const [now] = useState(() => new Date());
  const [energyState, setEnergyState] = useState<'calma' | 'plena' | 'neutra' | 'cansada'>('calma');
  const [mainFocusChecked, setMainFocusChecked] = useState(false);
  const [reflection1, setReflection1] = useState('');
  const [reflection2, setReflection2] = useState('');
  const [reflection3, setReflection3] = useState('');
  const isFirstMount = useRef(true);

  const loadData = useCallback(() => {
    setEvents(StorageService.getEvents(profile.id));
    setPlanner(StorageService.getPlanner(profile.id));
    setTodos(StorageService.getTodos(profile.id));
    setAreas(StorageService.getAreas(profile.id));
  }, [profile.id]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    loadData();
  }, [loadData]);

  const todayStr = toLocalDateStr(now);
  const todayEvents = todayEventsSorted(events, todayStr);
  const todayEventsTotal = events.filter(e => occursOn(e, todayStr)).length;
  const pendingCount = todos.filter(t => (t.status ? t.status !== 'completada' : !t.completed)).length;
  const criticalCount = todos.filter(isCritical).length;
  const critical = criticalTodos(todos);
  const allWeekBlocks = planner.filter(b => b.period === 'semanal');
  const weekBlocks = allWeekBlocks.slice(0, 4);
  const areaSummaries = computeAreaSummaries(areas, todos);

  // Compute week of the year
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const daysDiff = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const currentWeekNumber = Math.ceil((daysDiff + startOfYear.getDay() + 1) / 7);

  const handleToggleTodo = (id: string) => {
    StorageService.toggleTodo(profile.id, id);
    loadData();
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* =====================================================================
          1. CABECERA EDITORIAL & POST-IT ARTESANAL (Hero Card)
          ===================================================================== */}
      <section className={styles.heroCard} aria-labelledby="dash-greeting">
        {/* Washi Tape toppers */}
        <div className={styles.washiTapeSlateTop} aria-hidden="true" />
        <div className={styles.washiTapeOrchidTop} aria-hidden="true" />

        <div className={styles.heroGrid}>
          {/* Left Column: Metadata & Display Titular */}
          <div className={styles.heroLeftCol}>
            <div className={styles.heroMetaLine}>
              <span className={styles.heroMetaBadge}>CUADERNO DE ENFOQUE PERSONAL</span>
              <span className={styles.metaDot}>•</span>
              <span className={styles.metaDateItem}>FECHA: {String(now.getDate()).padStart(2, '0')}.{String(now.getMonth() + 1).padStart(2, '0')}.{now.getFullYear()}</span>
              <span className={styles.metaDot}>•</span>
              <span>Semestre: 2026-II</span>
              <span className={styles.metaDot}>•</span>
              <span className={styles.metaWeek}>Semana: #{currentWeekNumber}</span>
            </div>

            <p className={styles.atelierOverline}>ESPIRALIA ATELIER • HOY EN EL ESCRITORIO</p>
            <h1 className={styles.heroDate}>{formatHeroDate(now)}</h1>
            <div className={styles.displayFocusPlan}>
              focus plan<span className={styles.heroDot}>.</span>
            </div>
            <h2 id="dash-greeting" className={styles.heroTitle}>
              {greetingFor(now)}, {profile.name}.
            </h2>
            <p className={styles.heroSubtitle}>
              <em>clarify your mind. prioritize your energy.</em> Aquí está el pulso de tu día y lo que no puede esperar.
            </p>

            <blockquote className={styles.heroAphorism}>
              <Quote className={styles.aphorismQuoteIcon} size={22} aria-hidden="true" />
              <p className={styles.aphorismText}>
                «El orden no es una restricción, es el espacio donde florecen tus ideas y tu calma. Un renglón a la vez, sin prisa pero sin pausa.»
              </p>
            </blockquote>

            <ul className={styles.heroChips} aria-label="Resumen">
              <li className={styles.chip}>{countLabel(pendingCount, 'pendiente', 'pendientes')}</li>
              <li className={`${styles.chip} ${styles.chipCritical}`}>{countLabel(criticalCount, 'crítico', 'críticos')}</li>
            </ul>
          </div>

          {/* Right Column: Tactile Post-it Note taped with Brass Paperclip */}
          <div className={styles.heroRightCol}>
            <div className={styles.tactilePostIt}>
              {/* Dual ring brass paperclip */}
              <div className={styles.brassPaperclip} aria-hidden="true">
                <div className={styles.brassInnerLoop} />
              </div>
              {/* Orchid washi tape strip */}
              <div className={styles.postItWashiTape} aria-hidden="true" />
              {/* Hanko seal stamp */}
              <div className={styles.hankoSealStamp} aria-hidden="true">済</div>

              <div className={styles.postItContent}>
                <span className={styles.postItMottoLabel}>motto del día</span>
                <p className={styles.postItHandwriting}>
                  discipline today,<br />peace tomorrow.
                </p>
                <div className={styles.postItFooter}>
                  <Heart size={14} className={styles.postItHeart} aria-hidden="true" />
                  <span className={styles.postItState}>espíritu calmado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de 4 Acciones Instantáneas ('A un solo clic') */}
        <div className={styles.quickSection} aria-labelledby="dash-quick">
          <div className={styles.quickHeader}>
            <h3 id="dash-quick" className={styles.sectionLabel}>
              <Zap size={16} className={styles.quickHeaderIcon} aria-hidden="true" />
              <span>A un solo clic</span>
            </h3>
            <span className={styles.quickSubtext}>Respaldado en memoria local</span>
          </div>

          <div className={styles.quickGrid}>
            <button type="button" className={styles.quickBtn} onClick={() => onNavigate('todo')}>
              <div className={`${styles.quickIconBox} ${styles.quickIconTask}`} aria-hidden="true">
                <ListPlus size={20} />
              </div>
              <div className={styles.quickText}>
                <span className={styles.quickTitle}>Nueva tarea</span>
                <span className={styles.quickHint}>To-Do inmediato</span>
              </div>
            </button>

            <button type="button" className={styles.quickBtn} onClick={() => onNavigate('agenda')}>
              <div className={`${styles.quickIconBox} ${styles.quickIconEvent}`} aria-hidden="true">
                <CalendarPlus size={20} />
              </div>
              <div className={styles.quickText}>
                <span className={styles.quickTitle}>Nuevo evento</span>
                <span className={styles.quickHint}>Horarios y citas</span>
              </div>
            </button>

            <button
              type="button"
              className={styles.quickBtn}
              onClick={() => (onOpenReflection ? onOpenReflection() : onNavigate('notes'))}
            >
              <div className={`${styles.quickIconBox} ${styles.quickIconNote}`} aria-hidden="true">
                <BookOpen size={20} />
              </div>
              <div className={styles.quickText}>
                <span className={styles.quickTitle}>Nueva reflexión</span>
                <span className={styles.quickHint}>Bitácora y calma</span>
              </div>
            </button>

            <button
              type="button"
              className={styles.quickBtn}
              onClick={() => (onOpenLink ? onOpenLink() : onNavigate('folders'))}
            >
              <div className={`${styles.quickIconBox} ${styles.quickIconLink}`} aria-hidden="true">
                <LinkIcon size={20} />
              </div>
              <div className={styles.quickText}>
                <span className={styles.quickTitle}>Nuevo enlace / doc</span>
                <span className={styles.quickHint}>Recursos y vínculos</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. BENTO TRILOGÍA DE SERENIDAD & ENERGY PHASES
          ===================================================================== */}
      <section className={styles.bentoTrio}>
        {/* Card 1: Energy Check & Fases */}
        <div className={styles.bentoCard}>
          <div className={styles.bentoCardHeader}>
            <span className={styles.bentoTag}>
              <Moon size={16} aria-hidden="true" />
              <span>Energy Check &amp; Fases</span>
            </span>
            <span className={styles.bentoBadge}>Luna Creciente</span>
          </div>

          <div className={styles.lunarCycleVisualizer} aria-label="Fases lunares">
            <span className={styles.moonIcon} title="Luna Nueva">🌑</span>
            <span className={styles.moonIcon} title="Cuarto Creciente">🌒</span>
            <span className={`${styles.moonIcon} ${styles.moonIconActive}`} title="Gibosa Creciente (Hoy)">🌓</span>
            <span className={styles.moonIcon} title="Luna Llena">🌕</span>
            <span className={styles.moonIcon} title="Cuarto Menguante">🌘</span>
          </div>

          <p className={styles.clarityQuestion}>¿Cómo está tu nivel de claridad hoy?</p>

          <div className={styles.energySelector}>
            <button
              type="button"
              className={`${styles.energyBtn} ${energyState === 'plena' ? styles.energyBtnActive : ''}`}
              onClick={() => setEnergyState('plena')}
            >
              <span className={styles.energyEmoji}>🌿</span>
              <span className={styles.energyLabel}>Plena</span>
            </button>
            <button
              type="button"
              className={`${styles.energyBtn} ${energyState === 'calma' ? styles.energyBtnActive : ''}`}
              onClick={() => setEnergyState('calma')}
            >
              <span className={styles.energyEmoji}>☕</span>
              <span className={styles.energyLabel}>En Calma</span>
            </button>
            <button
              type="button"
              className={`${styles.energyBtn} ${energyState === 'neutra' ? styles.energyBtnActive : ''}`}
              onClick={() => setEnergyState('neutra')}
            >
              <span className={styles.energyEmoji}>☁️</span>
              <span className={styles.energyLabel}>Neutra</span>
            </button>
            <button
              type="button"
              className={`${styles.energyBtn} ${energyState === 'cansada' ? styles.energyBtnActive : ''}`}
              onClick={() => setEnergyState('cansada')}
            >
              <span className={styles.energyEmoji}>🕯️</span>
              <span className={styles.energyLabel}>Cansada</span>
            </button>
          </div>

          <div className={styles.bentoCardFooter}>
            <span>Registro mental diario</span>
            <span className={styles.statusStable}>
              <span className={styles.statusStableDot} />
              <span>Estable</span>
            </span>
          </div>
        </div>

        {/* Card 2: Métricas de Serenidad */}
        <div className={styles.bentoCard}>
          <div className={styles.cardWashiSlate} aria-hidden="true" />
          <div className={styles.bentoCardHeader}>
            <span className={styles.bentoTag}>
              <Sparkles size={16} aria-hidden="true" />
              <span>Métricas de Serenidad</span>
            </span>
            <span className={styles.bentoBadge}>Privacidad local</span>
          </div>

          <div className={styles.metricsQuadGrid}>
            <div className={styles.metricQuadTile}>
              <span className={styles.metricTileLabel}>Racha Serena</span>
              <div className={styles.metricTileValueBox}>
                <span className={styles.metricTileValAccent}>14</span>
                <span className={styles.metricTileUnit}>días</span>
              </div>
              <span className={styles.metricTileSub}>IndexedDB activo</span>
            </div>

            <div className={styles.metricQuadTile}>
              <span className={styles.metricTileLabel}>Foco Neto Hoy</span>
              <div className={styles.metricTileValueBox}>
                <span className={styles.metricTileVal}>5.5</span>
                <span className={styles.metricTileUnit}>horas</span>
              </div>
              <span className={styles.metricTileSub}>{allWeekBlocks.filter(b => b.completed).length} cumplidos hoy</span>
            </div>

            <div className={styles.metricQuadTile}>
              <span className={styles.metricTileLabel}>Ruido Digital</span>
              <div className={styles.metricTileValueBox}>
                <span className={styles.metricTileValTeal}>0%</span>
              </div>
              <span className={styles.metricTileSub}>0 rastreadores</span>
            </div>

            <div className={styles.metricQuadTile}>
              <span className={styles.metricTileLabel}>Rendimiento</span>
              <div className={styles.metricTileValueBox}>
                <span className={styles.metricTileValPurple}>68%</span>
              </div>
              <span className={styles.metricTileSub}>Objetivo semestral</span>
            </div>
          </div>

          <div className={styles.bentoCardFooter}>
            <span>Soberanía de datos</span>
            <span className={styles.dataSovereigntyText}>100% en tu máquina</span>
          </div>
        </div>

        {/* Card 3: Hábitos Semanales */}
        <div className={styles.bentoCard}>
          <div className={styles.cardWashiOrchid} aria-hidden="true" />
          <div className={styles.bentoCardHeader}>
            <span className={styles.bentoTag}>
              <CheckCircle size={16} aria-hidden="true" />
              <span>Hábitos Semanales</span>
            </span>
            <div className={styles.habitDaysHead}>
              <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
            </div>
          </div>

          <div className={styles.habitRowsList}>
            <div className={styles.habitRowItem}>
              <div className={styles.habitInfo}>
                <Car size={15} className={styles.habitIcon} aria-hidden="true" />
                <span className={styles.habitTitle}>Test CONASET</span>
              </div>
              <div className={styles.habitPillsRow}>
                <span className={styles.habitPillChecked}>✓</span>
                <span className={styles.habitPillChecked}>✓</span>
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
              </div>
            </div>

            <div className={styles.habitRowItem}>
              <div className={styles.habitInfo}>
                <Coffee size={15} className={styles.habitIcon} aria-hidden="true" />
                <span className={styles.habitTitle}>Pausa sin móvil</span>
              </div>
              <div className={styles.habitPillsRow}>
                <span className={styles.habitPillChecked}>✓</span>
                <span className={styles.habitPillChecked}>✓</span>
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
              </div>
            </div>

            <div className={styles.habitRowItem}>
              <div className={styles.habitInfo}>
                <Heart size={15} className={styles.habitIcon} aria-hidden="true" />
                <span className={styles.habitTitle}>Registro terapia</span>
              </div>
              <div className={styles.habitPillsRow}>
                <span className={styles.habitPillChecked}>✓</span>
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
              </div>
            </div>

            <div className={styles.habitRowItem}>
              <div className={styles.habitInfo}>
                <Moon size={15} className={styles.habitIcon} aria-hidden="true" />
                <span className={styles.habitTitle}>Dormir antes 23h</span>
              </div>
              <div className={styles.habitPillsRow}>
                <span className={styles.habitPillChecked}>✓</span>
                <span className={styles.habitPillChecked}>✓</span>
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
                <span className={styles.habitPillEmpty} />
              </div>
            </div>
          </div>

          <div className={styles.bentoCardFooter}>
            <span>Cumplimiento: 85%</span>
            <span className={styles.statusSuccess}>Semana #{currentWeekNumber} en curso</span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. MAIN LAYOUT GRID (7 cols / 5 cols)
          ===================================================================== */}
      <div className={styles.mainLayoutGrid}>
        {/* Columna Izquierda: Foco, Prioridades, Distracciones y Áreas */}
        <div className={styles.mainLeftCol}>
          {/* Banner Today's Main Focus */}
          <div className={styles.focusBanner}>
            <div className={styles.washiTapeBadge} aria-hidden="true">
              <Star size={14} />
              <span>TODAY'S MAIN FOCUS</span>
            </div>
            <div className={styles.focusInnerCard}>
              <input
                type="checkbox"
                id="main-focus-checkbox"
                className={styles.focusCheckbox}
                checked={mainFocusChecked}
                onChange={(e) => setMainFocusChecked(e.target.checked)}
                aria-label="Marcar foco principal completado"
              />
              <div className={styles.focusDetails}>
                <h3 className={`${styles.focusTitle} ${mainFocusChecked ? styles.rowTitleDone : ''}`}>
                  Completar 3 test CONASET Clase B y registrar fallos de virajes en rotondas
                </h3>
                <div className={styles.focusChipsRow}>
                  <span className={styles.focusChipArea}>
                    <span className={styles.focusChipDot} />
                    <span>Área: Licencia de Conducir</span>
                  </span>
                  <span className={styles.metaDot}>•</span>
                  <span>Estimado: 90 min</span>
                  <span className={styles.metaDot}>•</span>
                  <span className={styles.priorityHighBadge}>Alta Prioridad</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Priorities no negociables */}
          <section className={styles.card} aria-labelledby="dash-critical">
            <div className={styles.cardHeader}>
              <h3 id="dash-critical" className={styles.cardTitle}>
                <Pin size={18} aria-hidden="true" />
                <span>TOP PRIORITIES no negociables</span>
              </h3>
              <span className={styles.cardMeta}>{countLabel(criticalCount, 'crítico', 'críticos')}</span>
            </div>
            {critical.length === 0 ? (
              <p className={styles.emptyNotice}>Nada crítico pendiente</p>
            ) : (
              <ul className={styles.list} aria-label="No olvidar">
                {critical.map((t, idx) => {
                  const due = dueLabel(t.dueDate, todayStr);
                  return (
                    <li key={t.id} className={styles.criticalRow}>
                      <span className={styles.priorityNum}>{String(idx + 1).padStart(2, '0')}.</span>
                      <input
                        type="checkbox"
                        id={`dash-todo-${t.id}`}
                        className={styles.checkbox}
                        aria-label={`completar ${t.title}`}
                        checked={t.completed}
                        onChange={() => handleToggleTodo(t.id)}
                      />
                      <span className={`${styles.rowTitle} ${t.completed ? styles.rowTitleDone : ''}`}>{t.title}</span>
                      {due && <span className={styles.dueTag}>{due}</span>}
                    </li>
                  );
                })}
              </ul>
            )}
            <button type="button" className={styles.cardLink} onClick={() => onNavigate('todo')}>
              Ver todas las tareas
            </button>
          </section>

          {/* Eliminate Distractions Box with Metallic Paperclip */}
          <div className={styles.distractionBox}>
            <div className={styles.paperclipIcon} aria-hidden="true" />
            <div className={styles.distractionHeader}>
              <h4 className={styles.distractionTitle}>ELIMINATE DISTRACTIONS</h4>
              <span className={styles.distractionCommitment}>Compromiso</span>
            </div>
            <ul className={styles.distractionList}>
              <li>
                <span className={styles.distractionDot} />
                <span>Dejar el teléfono inteligente en modo no molestar y en otra habitación.</span>
              </li>
              <li>
                <span className={styles.distractionDot} />
                <span>Cero pestañas de noticias abiertas durante el bloque de estudio técnico.</span>
              </li>
              <li>
                <span className={styles.distractionDot} />
                <span>Si surge una urgencia mental, anotarla en el Brain Dump inferior sin ejecutarla.</span>
              </li>
            </ul>
          </div>

          {/* Progreso por Áreas Temáticas (Folder Tabs) */}
          {areas.length > 0 && (
            <section
              className={styles.areasSection}
              role="region"
              aria-label="Áreas temáticas clave"
            >
              <div className={styles.areasHeader}>
                <div>
                  <h3 id="dash-areas" className={styles.cardTitle}>
                    Progreso por Áreas Temáticas
                  </h3>
                  <p className={styles.heroSubtitle} style={{ marginTop: 2, fontSize: 13 }}>
                    Carpetas activas de vida y proyectos en curso (Plan 2026-II)
                  </p>
                </div>
                <span className={styles.areasMeta}>
                  {countLabel(areas.length, 'área en seguimiento', 'áreas en seguimiento')}
                </span>
              </div>
              <div className={styles.areasGrid}>
                {areaSummaries.map((s, idx) => (
                  <div key={s.area.id} className={styles.areaCard}>
                    <div className={styles.folderTabTop}>
                      Carpeta #{String(idx + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <div className={styles.areaTop}>
                        <div className={styles.areaIdentity}>
                          <span className={styles.areaDot} style={{ backgroundColor: s.area.color }} aria-hidden="true" />
                          <h4 className={styles.areaName}>{s.area.name}</h4>
                        </div>
                        <span className={styles.areaPercent}>{s.completionPercentage}%</span>
                      </div>
                      <div className={styles.progressBarBg} aria-hidden="true">
                        <div
                          className={styles.progressBarFill}
                          style={{ width: `${s.completionPercentage}%`, backgroundColor: s.area.color }}
                        />
                      </div>
                    </div>
                    <div className={styles.areaBottom}>
                      <span className={styles.areaPendingCount}>
                        {countLabel(s.pendingTodos, 'pendiente', 'pendientes')}
                      </span>
                      <button
                        type="button"
                        className={styles.areaActionBtn}
                        onClick={() => onNavigate('todo')}
                        aria-label={`Ver tareas del área ${s.area.name}`}
                      >
                        Ver área →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Columna Lateral Derecha: Horario, Mini Reminders, Planner, Notes y Reflexión */}
        <div className={styles.mainRightCol}>
          {/* Focus Schedule de Hoy (08:00 - 20:00) */}
          <section className={styles.card} aria-labelledby="dash-events">
            <div className={styles.cardHeader}>
              <h3 id="dash-events" className={styles.cardTitle}>
                <Clock size={18} aria-hidden="true" />
                <span>Focus Schedule de Hoy (08:00 - 20:00)</span>
              </h3>
              <span className={styles.cardMeta}>{countLabel(todayEventsTotal, 'evento', 'eventos')}</span>
            </div>

            {/* Embedded Active Session Preview card */}
            <div className={`${styles.eventRow} ${styles.activeSlotCard}`} style={{ marginBottom: 10 }}>
              <span className={styles.timeBlock} style={{ color: 'var(--color-primary)' }}>11:30</span>
              <div className={styles.pulseDot} aria-hidden="true" />
              <div className={styles.rowBody}>
                <span className={styles.rowTitle} style={{ fontWeight: 600 }}>Test CONASET Clase B (3 ensayos)</span>
                <span className={styles.badge} style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  EN CURSO
                </span>
              </div>
            </div>

            {todayEvents.length === 0 ? (
              <p className={styles.emptyNotice}>No hay eventos para hoy</p>
            ) : (
              <ul className={styles.list} aria-label="Eventos de hoy">
                {todayEvents.map(ev => {
                  const category = categoryOf(ev);
                  return (
                    <li key={ev.id} className={styles.eventRow}>
                      <span className={styles.timeBlock}>{ev.startTime ?? 'Todo el día'}</span>
                      <div className={styles.rowBody}>
                        <span className={styles.rowTitle}>{ev.title}</span>
                        <span
                          className={styles.badge}
                          style={{ backgroundColor: CATEGORY_COLORS[category].color, color: CATEGORY_COLORS[category].textColor }}
                        >
                          {FILTER_LABELS[category]}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <button type="button" className={styles.cardLink} onClick={() => onNavigate('agenda')}>
              Ver agenda completa
            </button>
          </section>

          {/* Mini Reminders Card */}
          <div className={styles.miniRemindersCard}>
            <div className={styles.miniRemindersWashi} aria-hidden="true" />
            <div className={styles.cardHeader} style={{ marginBottom: 6 }}>
              <h4 className={styles.cardTitle} style={{ fontSize: 16 }}>
                <Bell size={16} style={{ color: 'var(--color-accent-amber)' }} aria-hidden="true" />
                <span>Mini Reminders</span>
              </h4>
              <span className={styles.cardMeta}>Recordatorios</span>
            </div>
            <div className={styles.remindersList}>
              <div className={styles.reminderItem}>
                <span>Imprimir lámina de señales de tránsito</span>
                <span className={styles.reminderDatePill}>Hoy</span>
              </div>
              <div className={styles.reminderItem}>
                <span>Confirmar sesión de terapia de este viernes</span>
                <span className={styles.reminderDatePillMuted}>Jueves</span>
              </div>
              <div className={styles.reminderItem}>
                <span>Revisar rúbrica de postulación universitaria</span>
                <span className={styles.reminderDatePillMuted}>28 Nov</span>
              </div>
            </div>
          </div>

          {/* Planner de la semana */}
          <section className={styles.card} aria-labelledby="dash-planner">
            <div className={styles.cardHeader}>
              <h3 id="dash-planner" className={styles.cardTitle}>
                <Compass size={18} aria-hidden="true" />
                <span>Planner de la semana</span>
              </h3>
              <span className={styles.cardMeta}>{countLabel(allWeekBlocks.length, 'bloque', 'bloques')}</span>
            </div>
            {weekBlocks.length === 0 ? (
              <p className={styles.emptyNotice}>Sin bloques esta semana</p>
            ) : (
              <ul className={styles.list} aria-label="Planner de la semana">
                {weekBlocks.map(b => (
                  <li key={b.id} className={styles.plannerRow}>
                    <span className={`${styles.rowTitle} ${b.completed ? styles.rowTitleDone : ''}`}>{b.title}</span>
                    <span className={styles.slotTag}>{b.timeSlot}</span>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className={styles.cardLink} onClick={() => onNavigate('planner')}>
              Ver planner completo
            </button>
          </section>

          {/* NOTES / BRAIN DUMP card with 16px Graph Paper Grid */}
          <div className={styles.notesCard}>
            <div className={styles.notesWashiSlate} aria-hidden="true" />
            <div className={styles.notesCardHeader}>
              <h4 className={styles.notesCardTitle}>NOTES / BRAIN DUMP</h4>
              <span className={styles.notesCardTag}>Cuadrícula de ideas espontáneas</span>
            </div>
            <div className={styles.paperGridContainer}>
              <p className={styles.notesHandwriting}>
                — Comprar cuaderno de tapas duras tamaño A5 para el módulo de dibujo técnico.<br />
                — Recordar que el error en la rotonda fue ceder el paso cuando ya estaba dentro del anillo.<br />
                — «Respirar 4 segundos antes de encender la pantalla».
              </p>
              <div className={styles.autoSaveIndicator}>
                <Check size={12} aria-hidden="true" />
                <span>Guardado automáticamente</span>
              </div>
            </div>
            <button
              type="button"
              className={styles.notesCardBtn}
              onClick={() => (onOpenReflection ? onOpenReflection() : onNavigate('notes'))}
            >
              + Nueva Anotación Rápida
            </button>
          </div>

          {/* End of day reflection ♡ with 28px Ruled Notebook Lines */}
          <div className={styles.reflectionCard}>
            <h4 className={styles.reflectionTitle}>
              <span>End of day reflection <span className={styles.reflectionHeart}>♡</span></span>
              <span className={styles.cardMeta} style={{ fontSize: 11 }}>Completar al anochecer</span>
            </h4>
            <div className={styles.reflectionField}>
              <label className={styles.reflectionLabel}>¿Qué salió bien hoy?</label>
              <textarea
                className={styles.reflectionTextarea}
                placeholder="Escribe aquí los momentos de calma, avances o pequeñas victorias..."
                rows={2}
                value={reflection1}
                onChange={(e) => setReflection1(e.target.value)}
              />
            </div>
            <div className={styles.reflectionField}>
              <label className={styles.reflectionLabel}>¿Qué puedo mejorar?</label>
              <textarea
                className={styles.reflectionTextarea}
                placeholder="Reconoce tropiezos con amabilidad y sin juzgarte con dureza..."
                rows={2}
                value={reflection2}
                onChange={(e) => setReflection2(e.target.value)}
              />
            </div>
            <div className={styles.reflectionField}>
              <label className={styles.reflectionLabel}>¿Cuál será mi primer paso mañana?</label>
              <textarea
                className={styles.reflectionTextarea}
                placeholder="Define la primera acción precisa de las 08:00 AM..."
                rows={2}
                value={reflection3}
                onChange={(e) => setReflection3(e.target.value)}
              />
            </div>

            <div className={styles.reflectionFooterMotto}>
              <p className={styles.closingMotto}>
                « Small steps every day lead to big results. ♡ »
              </p>
              <div className={styles.sovereigntyStamp}>
                <ShieldCheck size={14} style={{ color: 'var(--color-accent-teal)' }} aria-hidden="true" />
                <span>Almacenamiento 100% Client-Side • Espiralia Taller de Escritorio v2.6</span>
              </div>
            </div>

            <button
              type="button"
              className={styles.saveReflectionBtn}
              onClick={() => onNavigate('notes')}
            >
              Guardar Pliego
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. MÉTRICAS Y RENDIMIENTO
          ===================================================================== */}
      <section className={styles.metricsSection} aria-labelledby="dash-metrics">
        <h3 id="dash-metrics" className={styles.cardTitle}>
          <BarChart2 size={18} aria-hidden="true" />
          <span>Métricas y Rendimiento</span>
        </h3>
        <div className={styles.metricsGrid}>
          <TaskCompletionChart todos={todos} />
          <CategoryDistributionChart todos={todos} planner={planner} />
        </div>
      </section>
    </div>
  );
};
