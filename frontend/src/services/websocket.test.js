import test from 'node:test';
import assert from 'node:assert/strict';

const ORIGINAL_CONSOLE = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

test.beforeEach(() => {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
});

test.afterEach(() => {
  console.log = ORIGINAL_CONSOLE.log;
  console.warn = ORIGINAL_CONSOLE.warn;
  console.error = ORIGINAL_CONSOLE.error;
});

function loadFreshWebSocketService() {
  return import('./websocket.js');
}

test('WebSocketService on/off/emit works for custom events', async () => {
  const { default: wsService } = await loadFreshWebSocketService();

  let calls = 0;
  const cb = () => {
    calls += 1;
  };

  wsService.on('hello', cb);
  wsService.emit('hello');
  assert.equal(calls, 1);

  wsService.off('hello', cb);
  wsService.emit('hello');
  assert.equal(calls, 1);

  wsService.disconnect();
});

test('WebSocketService.send warns when not connected', async () => {
  const { default: wsService } = await loadFreshWebSocketService();

  const originalWarn = console.warn;
  const warns = [];
  try {
    console.warn = (msg) => warns.push(String(msg));
    wsService.disconnect();
    wsService.send({ a: 1 });
    assert.ok(warns.some((m) => m.includes('not connected')));
  } finally {
    console.warn = originalWarn;
    wsService.disconnect();
  }
});

test('WebSocketService.connect sets url and emits connected on open', async () => {
  const originalWebSocket = globalThis.WebSocket;
  const originalLog = console.log;

  try {
    console.log = () => {};

    class MockWebSocket {
      static OPEN = 1;
      constructor(url) {
        this.url = url;
        this.readyState = 0;
        setTimeout(() => {
          this.readyState = MockWebSocket.OPEN;
          this.onopen?.();
        }, 0);
      }
      send() {}
      close() {
        this.readyState = 3;
      }
    }

    globalThis.WebSocket = MockWebSocket;

    const { default: wsService } = await loadFreshWebSocketService();

    let connected = 0;
    wsService.on('connected', () => (connected += 1));
    wsService.connect('ws://example.test');

    // allow microtasks/timers to run
    await new Promise((r) => setTimeout(r, 5));
    assert.equal(wsService.url, 'ws://example.test');
    assert.equal(connected, 1);

    wsService.disconnect();
  } finally {
    globalThis.WebSocket = originalWebSocket;
    console.log = originalLog;
  }
});

test('WebSocketService.connect returns early when already connecting', async () => {
  const originalWebSocket = globalThis.WebSocket;
  try {
    class MockWebSocket {
      static OPEN = 1;
      constructor() {
        // never opens
        this.readyState = 0;
      }
      send() {}
      close() {}
    }
    globalThis.WebSocket = MockWebSocket;
    const { default: wsService } = await loadFreshWebSocketService();
    wsService.connect('ws://one');
    // second call should no-op due to isConnecting
    wsService.connect('ws://two');
    assert.equal(wsService.url, 'ws://one');
    wsService.disconnect();
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

test('WebSocketService handles message parsing errors and emits telemetry/alerts', async () => {
  const originalWebSocket = globalThis.WebSocket;
  const originalError = console.error;
  const errors = [];
  try {
    console.error = (...args) => errors.push(args.map(String).join(' '));

    let instance = null;
    class MockWebSocket {
      static OPEN = 1;
      constructor() {
        instance = this;
        this.readyState = MockWebSocket.OPEN;
        setTimeout(() => this.onopen?.(), 0);
      }
      send() {}
      close() {}
    }
    globalThis.WebSocket = MockWebSocket;
    const { default: wsService } = await loadFreshWebSocketService();

    let telemetryCalls = 0;
    let alertsCalls = 0;
    wsService.on('telemetry', () => telemetryCalls++);
    wsService.on('alerts', () => alertsCalls++);

    wsService.connect('ws://x');
    await new Promise((r) => setTimeout(r, 5));
    assert.ok(instance);

    instance.onmessage?.({ data: JSON.stringify({ droneId: 1 }) });
    instance.onmessage?.({ data: JSON.stringify({ type: 'alerts', data: [] }) });
    instance.onmessage?.({ data: '{bad-json' });

    assert.equal(telemetryCalls, 1);
    assert.equal(alertsCalls, 1);
    assert.ok(errors.some((e) => e.includes('Error parsing WebSocket message')));

    wsService.disconnect();
  } finally {
    console.error = originalError;
    globalThis.WebSocket = originalWebSocket;
  }
});

test('WebSocketService emits error on websocket error', async () => {
  const originalWebSocket = globalThis.WebSocket;
  try {
    let instance = null;
    class MockWebSocket {
      static OPEN = 1;
      constructor() {
        instance = this;
        this.readyState = 0;
      }
      send() {}
      close() {}
    }
    globalThis.WebSocket = MockWebSocket;
    const { default: wsService } = await loadFreshWebSocketService();
    let calls = 0;
    wsService.on('error', () => calls++);
    wsService.connect('ws://x');
    assert.ok(instance);
    instance.onerror?.(new Error('ws'));
    assert.equal(calls, 1);
    wsService.disconnect();
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

test('WebSocketService onclose stops reconnect on code 1006', async () => {
  const originalWebSocket = globalThis.WebSocket;
  const originalWarn = console.warn;
  const warns = [];
  try {
    console.warn = (m) => warns.push(String(m));
    let instance = null;
    class MockWebSocket {
      static OPEN = 1;
      constructor() {
        instance = this;
        this.readyState = 0;
      }
      send() {}
      close() {}
    }
    globalThis.WebSocket = MockWebSocket;
    const { default: wsService } = await loadFreshWebSocketService();
    wsService.shouldReconnect = true;
    wsService.reconnectAttempts = 0;
    wsService.connect('ws://x');
    assert.ok(instance);
    instance.onclose?.({ code: 1006, reason: 'refused' });
    // shouldReconnect flipped to false
    assert.ok(warns.some((w) => w.includes('server unavailable')));
    wsService.disconnect();
  } finally {
    console.warn = originalWarn;
    globalThis.WebSocket = originalWebSocket;
  }
});

test('WebSocketService.reconnect stops after max attempts', async () => {
  const { default: wsService } = await loadFreshWebSocketService();
  const originalSetTimeout = globalThis.setTimeout;
  try {
    // make timers immediate
    globalThis.setTimeout = (fn) => { fn(); return 0; };
    wsService.shouldReconnect = true;
    wsService.reconnectAttempts = wsService.maxReconnectAttempts;
    wsService.reconnect();
    assert.equal(wsService.shouldReconnect, false);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    wsService.disconnect();
  }
});

test('WebSocketService.isConnected reflects ws.readyState', async () => {
  const originalWebSocket = globalThis.WebSocket;
  try {
    class MockWebSocket {
      static OPEN = 1;
      constructor() {
        this.readyState = MockWebSocket.OPEN;
      }
      send() {}
      close() {}
    }
    globalThis.WebSocket = MockWebSocket;
    const { default: wsService } = await loadFreshWebSocketService();
    wsService.connect('ws://x');
    assert.equal(wsService.isConnected(), true);
    wsService.disconnect();
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

test('WebSocketService.send sends JSON when connected', async () => {
  const originalWebSocket = globalThis.WebSocket;
  try {
    class MockWebSocket {
      static OPEN = 1;
      constructor() {
        this.readyState = MockWebSocket.OPEN;
        this.sent = [];
      }
      send(payload) {
        this.sent.push(payload);
      }
      close() {}
    }
    globalThis.WebSocket = MockWebSocket;
    const { default: wsService } = await loadFreshWebSocketService();
    wsService.connect('ws://x');
    wsService.send({ a: 1 });
    // @ts-ignore
    assert.equal(wsService.ws.sent[0], JSON.stringify({ a: 1 }));
    wsService.disconnect();
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

test('WebSocketService.connect handles WebSocket constructor throw', async () => {
  const originalWebSocket = globalThis.WebSocket;
  const originalError = console.error;
  const errors = [];
  try {
    console.error = (m) => errors.push(String(m));
    globalThis.WebSocket = class Boom {
      static OPEN = 1;
      constructor() {
        throw new Error('boom');
      }
    };
    const { default: wsService } = await loadFreshWebSocketService();
    wsService.connect('ws://x');
    assert.equal(wsService.shouldReconnect, false);
    assert.equal(wsService.isConnecting, false);
    assert.ok(errors.some((e) => e.includes('Error connecting WebSocket')));
    wsService.disconnect();
  } finally {
    console.error = originalError;
    globalThis.WebSocket = originalWebSocket;
  }
});

test('WebSocketService.onclose triggers reconnect when allowed', async () => {
  const originalWebSocket = globalThis.WebSocket;
  const originalLog = console.log;
  try {
    console.log = () => {};
    let instance = null;
    class MockWebSocket {
      static OPEN = 1;
      constructor() {
        instance = this;
        this.readyState = 0;
      }
      send() {}
      close() {}
    }
    globalThis.WebSocket = MockWebSocket;
    const { default: wsService } = await loadFreshWebSocketService();

    let reconnectCalled = 0;
    const originalReconnect = wsService.reconnect.bind(wsService);
    wsService.reconnect = () => { reconnectCalled++; };
    wsService.shouldReconnect = true;
    wsService.reconnectAttempts = 0;

    wsService.connect('ws://x');
    assert.ok(instance);
    instance.onclose?.({ code: 1000, reason: 'ok' });
    assert.equal(reconnectCalled, 1);

    wsService.reconnect = originalReconnect;
    wsService.disconnect();
  } finally {
    console.log = originalLog;
    globalThis.WebSocket = originalWebSocket;
  }
});

test('WebSocketService.reconnect schedules connect when shouldReconnect true', async () => {
  const { default: wsService } = await loadFreshWebSocketService();
  const originalSetTimeout = globalThis.setTimeout;
  const originalLog = console.log;
  try {
    console.log = () => {};
    globalThis.setTimeout = (fn) => { fn(); return 0; };
    let connectCalls = 0;
    const originalConnect = wsService.connect.bind(wsService);
    wsService.connect = () => { connectCalls++; };

    wsService.shouldReconnect = true;
    wsService.reconnectAttempts = 0;
    wsService.reconnect();
    assert.equal(connectCalls, 1);

    wsService.connect = originalConnect;
  } finally {
    console.log = originalLog;
    globalThis.setTimeout = originalSetTimeout;
    wsService.disconnect();
  }
});

test('WebSocketService.emit swallows listener errors', async () => {
  const { default: wsService } = await loadFreshWebSocketService();
  const originalError = console.error;
  const errors = [];
  try {
    console.error = (...args) => errors.push(args.map(String).join(' '));
    wsService.on('x', () => { throw new Error('listener'); });
    wsService.emit('x', 1);
    assert.ok(errors.some((e) => e.includes('Error in WebSocket listener for x')));
  } finally {
    console.error = originalError;
    wsService.disconnect();
  }
});

