import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesView } from '../components/NotesView';
import { StorageService } from '../services/storage';

describe('NotesView', () => {
  const profileId = 'p-notes-view';

  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza el diario de autoobservacion con pregunta ancla, pliego verjurado, reflexion nocturna y energia basal', () => {
    render(<NotesView profileId={profileId} />);

    expect(screen.getByRole('heading', { level: 1, name: /diario de autoobservación & desahogo/i })).toBeInTheDocument();
    expect(screen.getByText(/pregunta ancla de la semana/i)).toBeInTheDocument();
    expect(screen.getByText(/descompresión mental & autoobservación/i)).toBeInTheDocument();
    expect(screen.getByText(/avance conaset - simulacro clase b/i)).toBeInTheDocument();
    expect(screen.getByText(/¿qué fluyó bien hoy\?/i)).toBeInTheDocument();
    expect(screen.getByText(/modo estilográfica: activo/i)).toBeInTheDocument();
    expect(screen.getByText(/brain dump rápido/i)).toBeInTheDocument();
  });

  it('renderiza la vista y permite crear una nueva reflexión terapéutica', async () => {
    const user = userEvent.setup();
    render(<NotesView profileId={profileId} />);

    expect(screen.getByRole('heading', { level: 2, name: /notas & reflexiones/i })).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /\+ nueva nota/i });
    await user.click(addBtn);

    const titleInput = screen.getByLabelText(/título/i);
    await user.type(titleInput, 'Reflexión Semanal');

    const contentInput = screen.getByLabelText(/contenido/i);
    await user.type(contentInput, 'Hoy logré identificar patrones de ansiedad y aplicar técnicas de respiración.');

    const isReflectionCheckbox = screen.getByLabelText(/marcar como reflexión de diario/i);
    await user.click(isReflectionCheckbox);

    const saveBtn = screen.getByRole('button', { name: /guardar nota/i });
    await user.click(saveBtn);

    expect(screen.getByText('Reflexión Semanal')).toBeInTheDocument();
    expect(screen.getByText(/patrones de ansiedad/i)).toBeInTheDocument();
  });

  it('permite alternar entre pestañas y filtrar notas', async () => {
    const user = userEvent.setup();
    StorageService.saveNote({
      id: 'n-1',
      profileId,
      title: 'Nota rápida de compras',
      content: 'Comprar lápices y libreta',
      isReflection: false,
      createdAt: '2026-10-14',
      updatedAt: '2026-10-14',
    });
    StorageService.saveNote({
      id: 'n-2',
      profileId,
      title: 'Reflexión profunda',
      content: 'Metacognición sobre el estudio',
      isReflection: true,
      createdAt: '2026-10-14',
      updatedAt: '2026-10-14',
    });

    render(<NotesView profileId={profileId} />);

    expect(screen.getByText('Nota rápida de compras')).toBeInTheDocument();
    expect(screen.getByText('Reflexión profunda')).toBeInTheDocument();

    const reflectionsTab = screen.getByRole('button', { name: /reflexiones & diario/i });
    await user.click(reflectionsTab);

    expect(screen.queryByText('Nota rápida de compras')).not.toBeInTheDocument();
    expect(screen.getByText('Reflexión profunda')).toBeInTheDocument();
  });

  it('flujo integral de usuario: crea nota con secciones bujo y callout, verifica BujoCard con cinta, hidrata el pliego superior y filtra por pestaña', async () => {
    const user = userEvent.setup();

    // Pre-poblamos una nota rápida no-reflexión para verificar el aislamiento y filtrado por pestañas
    StorageService.saveNote({
      id: 'note-compras',
      profileId,
      title: 'Lista de Ferretería',
      content: 'Tornillos y lija fina',
      isReflection: false,
      tags: ['taller'],
      createdAt: '2026-10-17T08:00:00.000Z',
      updatedAt: '2026-10-17T08:00:00.000Z',
    });

    render(<NotesView profileId={profileId} />);

    // 1. Crear una nueva nota con secciones § 1. y caja [caja: Examen | 100% | Excelente]
    const addBtn = screen.getByRole('button', { name: /\+ nueva nota/i });
    await user.click(addBtn);

    const titleInput = screen.getByLabelText(/título/i);
    await user.type(titleInput, 'Evaluación Conaset B');

    const contentInput = screen.getByLabelText(/contenido/i);
    await user.type(
      contentInput,
      '§ 1. Preparación Teórica\nRevisar distancias de frenado y rotondas.\n\n[[caja: Examen | 100% | Excelente]'
    );

    const reflectionCheckbox = screen.getByLabelText(/marcar como reflexión de diario/i);
    await user.click(reflectionCheckbox);

    const tagsInput = screen.getByLabelText(/etiquetas/i);
    await user.type(tagsInput, 'conaset, estudio');

    const saveBtn = screen.getByRole('button', { name: /guardar nota/i });
    await user.click(saveBtn);

    // 2. Verificar que aparece en la grilla con BujoCard (cinta marcapáginas, §)
    const cardTitle = screen.getByRole('heading', { level: 3, name: /evaluación conaset b/i });
    expect(cardTitle).toBeInTheDocument();

    const bujoRibbons = screen.getAllByTestId('bujo-ribbon');
    expect(bujoRibbons.length).toBeGreaterThanOrEqual(1);

    // La tarjeta BujoCard muestra el preview formateado del callout y la sección
    expect(screen.getByText(/Examen:\s*Excelente/i)).toBeInTheDocument();
    expect(screen.getByText(/Reflexión/i)).toBeInTheDocument();

    // 3. Seleccionar la tarjeta y verificar que el pliego superior se hidrata con la caja y secciones
    await user.click(cardTitle);

    // Pliego superior hidratado
    expect(screen.getByText('Pliego Activo de Trabajo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /preparación teórica/i })).toBeInTheDocument();
    expect(screen.getByText('§ 1.')).toBeInTheDocument();
    expect(screen.getByText('Examen')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Excelente')).toBeInTheDocument();
    expect(screen.getByText(/palabras escritas/i)).toBeInTheDocument();

    // Cinta marcapáginas del pliego superior refleja el color de estudio (#047857)
    const pliegoRibbon = screen.getByTestId('pliego-ribbon');
    expect(pliegoRibbon).toHaveStyle({ backgroundColor: '#047857' });

    // 4. Filtrar por reflexiones y verificar que solo permanecen las reflexiones
    expect(screen.getByText('Lista de Ferretería')).toBeInTheDocument();

    const reflectionsTab = screen.getByRole('button', { name: /reflexiones & diario/i });
    await user.click(reflectionsTab);

    expect(screen.queryByText('Lista de Ferretería')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /evaluación conaset b/i })).toBeInTheDocument();
  });
});

