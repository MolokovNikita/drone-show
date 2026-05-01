import test from 'node:test';
import assert from 'node:assert/strict';
import { configureStore } from '@reduxjs/toolkit';

import reducer, { addAlert, fetchAlerts, acknowledgeAlert } from './alertSlice.js';
import api from '../../services/api.js';

test('alertSlice: addAlert unshifts to items', () => {
  // Проверяем reducer: новый алерт должен добавляться в начало массива (unshift),
  // чтобы свежие уведомления отображались первыми.
  const before = { items: [{ id: 2 }], loading: false };
  const after = reducer(before, addAlert({ id: 1 }));
  assert.deepEqual(after.items.map((a) => a.id), [1, 2]);
});

test('alertSlice: fetchAlerts.fulfilled replaces items', async () => {
  // Проверяем thunk + reducer:
  // 1) мокируем api.get, чтобы не ходить в сеть
  // 2) диспатчим fetchAlerts
  // 3) убеждаемся, что items в сторе заменились данными ответа
  const originalGet = api.get;
  try {
    api.get = async () => ({ data: [{ id: 1 }] });
    const store = configureStore({ reducer: { alerts: reducer } });
    const action = await store.dispatch(fetchAlerts());
    assert.equal(action.type, 'alerts/fetchAll/fulfilled');
    assert.deepEqual(store.getState().alerts.items, [{ id: 1 }]);
  } finally {
    // Возвращаем оригинальную реализацию, чтобы не влиять на другие тесты
    api.get = originalGet;
  }
});

test('alertSlice: acknowledgeAlert.fulfilled updates existing item', async () => {
  // Проверяем acknowledgeAlert:
  // при успешном ответе API алерт с таким же id в items должен обновиться.
  const originalPost = api.post;
  try {
    api.post = async () => ({ data: { id: 1, resolved: true } });
    const store = configureStore({ reducer: { alerts: reducer } });
    // Создаём начальное состояние с двумя алертами
    store.dispatch(addAlert({ id: 2, resolved: false }));
    store.dispatch(addAlert({ id: 1, resolved: false }));
    const action = await store.dispatch(acknowledgeAlert(1));
    assert.equal(action.type, 'alerts/acknowledge/fulfilled');
    assert.equal(store.getState().alerts.items.find((a) => a.id === 1).resolved, true);
  } finally {
    // Возвращаем оригинальный api.post
    api.post = originalPost;
  }
});

test('alertSlice: acknowledgeAlert.fulfilled does nothing when item missing', () => {
  // Если в state нет алерта с таким id, reducer не должен менять массив items.
  const before = { items: [{ id: 2 }], loading: false };
  const after = reducer(before, acknowledgeAlert.fulfilled({ id: 1 }, 'req', 1));
  assert.deepEqual(after.items, [{ id: 2 }]);
});

