const cleanText = (value) => String(value ?? '').trim();

function normalizeExercise(exercise) {
  return {
    name: cleanText(exercise.name),
    sets: Number(exercise.sets),
    reps: Number(exercise.reps),
    weight: exercise.weight === '' || exercise.weight == null ? null : Number(exercise.weight),
  };
}

function validateWorkout(workout) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workout.date)) throw new Error('Укажите дату тренировки');
  if (!workout.exercises.length || workout.exercises.some(({ name, sets, reps, weight }) => (
    !name || !Number.isFinite(sets) || sets <= 0 || !Number.isFinite(reps) || reps <= 0 ||
    (weight !== null && (!Number.isFinite(weight) || weight < 0))
  ))) throw new Error('Добавьте хотя бы одно упражнение с корректными подходами и повторами');
  return workout;
}

export function createWorkout(input, dependencies = {}) {
  const now = dependencies.now ?? (() => new Date().toISOString());
  const id = dependencies.id ?? (() => crypto.randomUUID());
  const timestamp = now();
  return validateWorkout({
    id: id(),
    date: cleanText(input.date),
    title: cleanText(input.title),
    notes: cleanText(input.notes),
    videoUrl: cleanText(input.videoUrl),
    exercises: (input.exercises ?? []).map(normalizeExercise),
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export function updateWorkout(workouts, workoutId, changes, dependencies = {}) {
  const now = dependencies.now ?? (() => new Date().toISOString());
  return workouts.map((workout) => {
    if (workout.id !== workoutId) return workout;
    const next = {
      ...workout,
      ...changes,
      title: changes.title === undefined ? workout.title : cleanText(changes.title),
      notes: changes.notes === undefined ? workout.notes : cleanText(changes.notes),
      videoUrl: changes.videoUrl === undefined ? workout.videoUrl : cleanText(changes.videoUrl),
      exercises: changes.exercises === undefined ? workout.exercises : changes.exercises.map(normalizeExercise),
      updatedAt: now(),
    };
    return validateWorkout(next);
  });
}

export const deleteWorkout = (workouts, workoutId) => workouts.filter(({ id }) => id !== workoutId);

export function filterWorkouts(workouts, query) {
  const needle = cleanText(query).toLocaleLowerCase('ru');
  if (!needle) return workouts;
  return workouts.filter(({ date, title, exercises }) => [
    date,
    title,
    ...exercises.map(({ name }) => name),
  ].some((value) => cleanText(value).toLocaleLowerCase('ru').includes(needle)));
}
