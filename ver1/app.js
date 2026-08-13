import { createWorkout, deleteWorkout, filterWorkouts, updateWorkout } from './store.js';

const WORKOUTS_KEY = 'training-app.workouts.v1';
const PROFILE_KEY = 'training-app.profile.v1';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const readJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const persist = () => localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
let workouts = readJson(WORKOUTS_KEY, []);
let editingId = null;

function showTab(name) {
  $$('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === name));
  $$('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${name}`));
  if (name === 'add') $('#title').focus();
}

function addExercise(exercise = {}) {
  const row = $('#exercise-template').content.firstElementChild.cloneNode(true);
  row.querySelector('[name="exercise-name"]').value = exercise.name ?? '';
  row.querySelector('[name="sets"]').value = exercise.sets ?? '';
  row.querySelector('[name="reps"]').value = exercise.reps ?? '';
  row.querySelector('[name="weight"]').value = exercise.weight ?? '';
  row.querySelector('.remove-exercise').addEventListener('click', () => {
    if ($$('.exercise-row').length === 1) return showMessage('Должно остаться хотя бы одно упражнение', true);
    row.remove();
  });
  $('#exercises').append(row);
}

function showMessage(text, error = false, target = '#form-message') {
  const element = $(target);
  element.textContent = text;
  element.className = `message show${error ? ' error' : ''}`;
  setTimeout(() => element.classList.remove('show'), 3500);
}

function resetForm() {
  editingId = null;
  $('#workout-form').reset();
  $('#date').value = new Date().toISOString().slice(0, 10);
  $('#exercises').replaceChildren();
  addExercise();
  $('#form-title').textContent = 'Добавить тренировку';
  $('#cancel-edit').classList.add('hidden');
}

function workoutFromForm() {
  return {
    title: $('#title').value,
    date: $('#date').value,
    notes: $('#notes').value,
    videoUrl: $('#video-url').value,
    exercises: $$('.exercise-row').map((row) => ({
      name: row.querySelector('[name="exercise-name"]').value,
      sets: row.querySelector('[name="sets"]').value,
      reps: row.querySelector('[name="reps"]').value,
      weight: row.querySelector('[name="weight"]').value,
    })),
  };
}

function formatDate(date) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

function render() {
  const shown = filterWorkouts(workouts, $('#search').value).sort((a, b) => b.date.localeCompare(a.date));
  $('#workout-count').textContent = workouts.length;
  const list = $('#workouts-list');
  list.replaceChildren();
  if (!shown.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.innerHTML = workouts.length ? '<strong>Ничего не найдено</strong>Попробуйте изменить запрос.' : '<strong>Дневник пока пуст</strong>Добавьте первую тренировку — прогресс начинается с записи.';
    list.append(empty);
    return;
  }
  shown.forEach((workout) => {
    const article = document.createElement('article');
    article.className = 'workout-card';
    const top = document.createElement('div');
    top.className = 'workout-top';
    const summary = document.createElement('div');
    summary.innerHTML = `<div class="workout-date">${formatDate(workout.date)}</div><div class="workout-title"></div>`;
    summary.querySelector('.workout-title').textContent = workout.title || 'Тренировка';
    const chips = document.createElement('div');
    chips.className = 'exercise-summary';
    workout.exercises.forEach((exercise) => {
      const chip = document.createElement('span');
      chip.className = 'exercise-chip';
      chip.textContent = `${exercise.name} · ${exercise.sets}×${exercise.reps}${exercise.weight !== null ? ` · ${exercise.weight} кг` : ''}`;
      chips.append(chip);
    });
    summary.append(chips);
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    actions.innerHTML = '<button class="icon-button details" type="button">Подробнее</button><button class="icon-button edit" type="button">Изменить</button><button class="icon-button danger delete" type="button">Удалить</button>';
    top.append(summary, actions);
    const details = document.createElement('div');
    details.className = 'workout-details hidden';
    if (workout.notes) { const p = document.createElement('p'); p.textContent = `Заметки: ${workout.notes}`; details.append(p); }
    if (workout.videoUrl) { const a = document.createElement('a'); a.href = workout.videoUrl; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Открыть видео ↗'; details.append(a); }
    if (!workout.notes && !workout.videoUrl) details.textContent = 'Дополнительных заметок нет.';
    actions.querySelector('.details').addEventListener('click', (event) => { details.classList.toggle('hidden'); event.currentTarget.textContent = details.classList.contains('hidden') ? 'Подробнее' : 'Скрыть'; });
    actions.querySelector('.edit').addEventListener('click', () => editWorkout(workout));
    actions.querySelector('.delete').addEventListener('click', () => { if (confirm('Удалить эту тренировку?')) { workouts = deleteWorkout(workouts, workout.id); persist(); render(); } });
    article.append(top, details);
    list.append(article);
  });
}

function editWorkout(workout) {
  editingId = workout.id;
  $('#title').value = workout.title;
  $('#date').value = workout.date;
  $('#notes').value = workout.notes;
  $('#video-url').value = workout.videoUrl;
  $('#exercises').replaceChildren();
  workout.exercises.forEach(addExercise);
  $('#form-title').textContent = 'Редактировать тренировку';
  $('#cancel-edit').classList.remove('hidden');
  showTab('add');
}

$$('.tab').forEach((tab) => tab.addEventListener('click', () => showTab(tab.dataset.tab)));
$('#quick-add').addEventListener('click', () => { resetForm(); showTab('add'); });
$('#add-exercise').addEventListener('click', () => addExercise());
$('#cancel-edit').addEventListener('click', () => { resetForm(); showTab('workouts'); });
$('#search').addEventListener('input', render);
$('#workout-form').addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const input = workoutFromForm();
    workouts = editingId ? updateWorkout(workouts, editingId, input) : [createWorkout(input), ...workouts];
    persist();
    resetForm();
    render();
    showTab('workouts');
  } catch (error) { showMessage(error.message, true); }
});

function loadProfile() {
  const profile = readJson(PROFILE_KEY, {});
  $('#profile-name').value = profile.name ?? '';
  $('#profile-weight').value = profile.weight ?? '';
  $('#profile-height').value = profile.height ?? '';
  $('#profile-goal').value = profile.goal ?? 'Сила';
  $('#profile-info').value = profile.info ?? '';
}
$('#profile-form').addEventListener('submit', (event) => {
  event.preventDefault();
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: $('#profile-name').value.trim(), weight: $('#profile-weight').value, height: $('#profile-height').value, goal: $('#profile-goal').value, info: $('#profile-info').value.trim() }));
  showMessage('Профиль сохранён', false, '#profile-message');
});

$('#today-label').textContent = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
resetForm();
loadProfile();
render();
