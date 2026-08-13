import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createWorkout,
  deleteWorkout,
  filterWorkouts,
  updateWorkout,
} from '../ver1/store.js';

test('creates a normalized workout without mutating the input', () => {
  const input = {
    date: '2026-08-13',
    title: '  Тяжёлый день  ',
    exercises: [{ name: 'Жим лёжа', sets: '5', reps: '3', weight: '100' }],
  };

  const workout = createWorkout(input, { now: () => '2026-08-13T12:00:00.000Z', id: () => 'w-1' });

  assert.deepEqual(workout, {
    id: 'w-1',
    date: '2026-08-13',
    title: 'Тяжёлый день',
    notes: '',
    videoUrl: '',
    exercises: [{ name: 'Жим лёжа', sets: 5, reps: 3, weight: 100 }],
    createdAt: '2026-08-13T12:00:00.000Z',
    updatedAt: '2026-08-13T12:00:00.000Z',
  });
  assert.equal(input.title, '  Тяжёлый день  ');
});

test('rejects workouts without valid exercises', () => {
  assert.throws(
    () => createWorkout({ date: '2026-08-13', exercises: [{ name: '', sets: 0, reps: 3 }] }),
    /Добавьте хотя бы одно упражнение/,
  );
});

test('updates and deletes only the selected workout', () => {
  const workouts = [
    createWorkout({ date: '2026-08-12', title: 'A', exercises: [{ name: 'Тяга', sets: 3, reps: 2 }] }, { id: () => 'a' }),
    createWorkout({ date: '2026-08-13', title: 'B', exercises: [{ name: 'Жим', sets: 4, reps: 4 }] }, { id: () => 'b' }),
  ];
  const updated = updateWorkout(workouts, 'a', { title: 'Новый заголовок' }, { now: () => 'later' });

  assert.equal(updated[0].title, 'Новый заголовок');
  assert.equal(updated[0].updatedAt, 'later');
  assert.equal(updated[1], workouts[1]);
  assert.deepEqual(deleteWorkout(updated, 'a').map(({ id }) => id), ['b']);
});

test('filters by title, date, and exercise name', () => {
  const workouts = [
    createWorkout({ date: '2026-08-12', title: 'Ноги', exercises: [{ name: 'Приседания', sets: 5, reps: 5 }] }, { id: () => 'a' }),
    createWorkout({ date: '2026-08-13', title: 'Грудь', exercises: [{ name: 'Жим лёжа', sets: 4, reps: 6 }] }, { id: () => 'b' }),
  ];

  assert.deepEqual(filterWorkouts(workouts, 'жим').map(({ id }) => id), ['b']);
  assert.deepEqual(filterWorkouts(workouts, '2026-08-12').map(({ id }) => id), ['a']);
  assert.equal(filterWorkouts(workouts, ''), workouts);
});
