const test = require('node:test');
const assert = require('node:assert/strict');

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

function clearEnv(keys) {
  for (const k of keys) {
    delete process.env[k];
  }
}

function loadFreshAIService() {
  // Silence logger output for unit tests (warn/info/error from aiService parsing paths)
  const loggerPath = require.resolve('../utils/logger');
  require.cache[loggerPath] = {
    id: loggerPath,
    filename: loggerPath,
    loaded: true,
    exports: { error: () => {}, warn: () => {}, info: () => {} }
  };

  const servicePath = require.resolve('./aiService');
  delete require.cache[servicePath];
  return require('./aiService');
}

test('AIService.generateShow without API key returns template structure', async () => {
  const originalRandom = Math.random;
  const envKeys = ['GROQ_API_KEY', 'OPENAI_API_KEY'];
  const savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));

  try {
    clearEnv(envKeys);
    Math.random = () => 0; // deterministic theme/venue choice

    const aiService = loadFreshAIService();
    // aiService loads dotenv on import; force "no key" behavior to avoid network calls
    aiService.apiKey = null;
    const result = await aiService.generateShow('My Prompt');

    assert.ok(result.userView);
    assert.ok(result.systemData);
    assert.equal(typeof result.userView.showName, 'string');
    assert.ok(Array.isArray(result.systemData.choreographyIdeas));
    assert.ok(result.systemData.choreographyIdeas.length > 0);

    for (const idea of result.systemData.choreographyIdeas) {
      assert.equal(typeof idea.droneCount, 'number');
      assert.ok(Array.isArray(idea.dronePositions));
      assert.equal(idea.dronePositions.length, idea.droneCount);
    }
  } finally {
    Math.random = originalRandom;
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  }
});

test('AIService.generateShow falls back to template when API returns non-JSON', async () => {
  const originalRandom = Math.random;
  const envKeys = ['GROQ_API_KEY', 'OPENAI_API_KEY'];
  const savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));

  const axios = require('axios');
  const originalPost = axios.post;

  try {
    process.env.GROQ_API_KEY = 'fake';
    delete process.env.OPENAI_API_KEY;
    Math.random = () => 0;

    axios.post = async () => ({
      data: {
        choices: [{ message: { content: 'this is not json' } }]
      }
    });

    const aiService = loadFreshAIService();
    const result = await aiService.generateShow('Any');

    assert.ok(result.userView);
    assert.ok(result.systemData);
    assert.ok(Array.isArray(result.systemData.choreographyIdeas));
    assert.ok(result.systemData.choreographyIdeas.length > 0);
  } finally {
    axios.post = originalPost;
    Math.random = originalRandom;
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  }
});

test('AIService.generateShow parses valid JSON response and fills missing dronePositions', async () => {
  const originalRandom = Math.random;
  const envKeys = ['GROQ_API_KEY', 'OPENAI_API_KEY'];
  const savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));

  const axios = require('axios');
  const originalPost = axios.post;

  try {
    process.env.GROQ_API_KEY = 'fake';
    delete process.env.OPENAI_API_KEY;
    Math.random = () => 0;

    axios.post = async () => ({
      data: {
        choices: [{
          message: {
            content: JSON.stringify({
              userView: {
                showName: 'Demo',
                venue: 'Somewhere',
                durationSeconds: 120,
                concept: 'C',
                choreographyIdeas: [{ name: 'A', description: 'd', durationSeconds: 60, droneCount: 2 }]
              },
              systemData: {
                showName: 'Demo',
                venue: 'Somewhere',
                durationSeconds: 120,
                notes: 'N',
                choreographyIdeas: [{
                  name: 'A',
                  description: 't',
                  durationSeconds: 60,
                  droneCount: 2,
                  dronePositions: [] // force generation path
                }]
              }
            })
          }
        }]
      }
    });

    const aiService = loadFreshAIService();
    const result = await aiService.generateShow('Any');

    assert.equal(result.systemData.choreographyIdeas[0].dronePositions.length, 2);
  } finally {
    axios.post = originalPost;
    Math.random = originalRandom;
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  }
});

test('AIService.generateShow attempts to fix truncated JSON', async () => {
  const originalRandom = Math.random;
  const envKeys = ['GROQ_API_KEY', 'OPENAI_API_KEY'];
  const savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));

  const axios = require('axios');
  const originalPost = axios.post;

  try {
    process.env.GROQ_API_KEY = 'fake';
    delete process.env.OPENAI_API_KEY;
    Math.random = () => 0;

    // Intentionally missing internal closing braces/brackets, but keep a trailing "}" so the JSON regex matches.
    // The service will append missing "]" / "}" and then parse.
    const truncated =
      '{"userView":{"showName":"Demo","venue":"X","durationSeconds":10,"concept":"c","choreographyIdeas":[]},"systemData":{"showName":"Demo","venue":"X","durationSeconds":10,"notes":"n","choreographyIdeas":[{"name":"A","description":"t","durationSeconds":10,"droneCount":1,"dronePositions":[{"startPosition":{"x":0,"y":0,"z":0},"endPosition":{"x":1,"y":1,"z":1},"maxAltitude":6}]}}}';

    axios.post = async () => ({
      data: { choices: [{ message: { content: truncated } }] }
    });

    const aiService = loadFreshAIService();
    const result = await aiService.generateShow('Any');
    // Even if the JSON cannot be fully repaired, the service must fall back to a valid template payload.
    assert.ok(result.systemData);
    assert.equal(typeof result.systemData.showName, 'string');
    assert.ok(result.systemData.showName.includes('Any'));
  } finally {
    axios.post = originalPost;
    Math.random = originalRandom;
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  }
});

test('AIService.generateShow closes missing braces in truncated JSON', async () => {
  const originalRandom = Math.random;
  const envKeys = ['GROQ_API_KEY', 'OPENAI_API_KEY'];
  const savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));

  const axios = require('axios');
  const originalPost = axios.post;

  try {
    process.env.GROQ_API_KEY = 'fake';
    delete process.env.OPENAI_API_KEY;
    Math.random = () => 0;

    // braces are intentionally unbalanced; service should append "}" in the while-loop
    const truncated = '{"userView":{"showName":"Demo","venue":"X","durationSeconds":10,"concept":"c","choreographyIdeas":[]},"systemData":{"showName":"Demo","venue":"X","durationSeconds":10,"notes":"n","choreographyIdeas":[]';
    axios.post = async () => ({ data: { choices: [{ message: { content: truncated } }] } });

    const aiService = loadFreshAIService();
    const result = await aiService.generateShow('Any');
    assert.ok(result.systemData);
  } finally {
    axios.post = originalPost;
    Math.random = originalRandom;
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  }
});

test('AIService.generateShow falls back when response format is invalid (no systemData/showName)', async () => {
  const originalRandom = Math.random;
  const envKeys = ['GROQ_API_KEY', 'OPENAI_API_KEY'];
  const savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));

  const axios = require('axios');
  const originalPost = axios.post;

  try {
    process.env.GROQ_API_KEY = 'fake';
    delete process.env.OPENAI_API_KEY;
    Math.random = () => 0;

    axios.post = async () => ({
      data: { choices: [{ message: { content: JSON.stringify({ userView: { x: 1 } }) } }] }
    });

    const aiService = loadFreshAIService();
    const result = await aiService.generateShow('Any');
    assert.ok(result.userView);
    assert.ok(result.systemData);
  } finally {
    axios.post = originalPost;
    Math.random = originalRandom;
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  }
});

test('AIService.generateShow keeps partial existing positions when generating missing ones', async () => {
  const originalRandom = Math.random;
  const envKeys = ['GROQ_API_KEY', 'OPENAI_API_KEY'];
  const savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));

  const axios = require('axios');
  const originalPost = axios.post;

  try {
    process.env.GROQ_API_KEY = 'fake';
    delete process.env.OPENAI_API_KEY;
    Math.random = () => 0;

    axios.post = async () => ({
      data: {
        choices: [{
          message: {
            content: JSON.stringify({
              userView: { showName: 'S', venue: 'V', durationSeconds: 10, concept: 'c', choreographyIdeas: [] },
              systemData: {
                showName: 'S',
                venue: 'V',
                durationSeconds: 10,
                notes: 'n',
                choreographyIdeas: [{
                  name: 'A',
                  description: 't',
                  durationSeconds: 10,
                  droneCount: 2,
                  dronePositions: [
                    { startPosition: { x: 1, y: 1, z: 1 }, endPosition: { x: 2, y: 2, z: 2 }, maxAltitude: 5 }
                  ]
                }]
              }
            })
          }
        }]
      }
    });

    const aiService = loadFreshAIService();
    const result = await aiService.generateShow('Any');
    assert.equal(result.systemData.choreographyIdeas[0].dronePositions.length, 2);
    assert.equal(result.systemData.choreographyIdeas[0].dronePositions[0].startPosition.x, 1);
  } finally {
    axios.post = originalPost;
    Math.random = originalRandom;
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  }
});

test('AIService.generateShow falls back when parsed response is empty object', async () => {
  const originalRandom = Math.random;
  const envKeys = ['GROQ_API_KEY', 'OPENAI_API_KEY'];
  const savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));

  const axios = require('axios');
  const originalPost = axios.post;

  try {
    process.env.GROQ_API_KEY = 'fake';
    delete process.env.OPENAI_API_KEY;
    Math.random = () => 0;

    axios.post = async () => ({
      data: { choices: [{ message: { content: '{}' } }] }
    });

    const aiService = loadFreshAIService();
    const result = await aiService.generateShow('Any');
    assert.ok(result.userView);
    assert.ok(result.systemData);
    assert.ok(Array.isArray(result.systemData.choreographyIdeas));
  } finally {
    axios.post = originalPost;
    Math.random = originalRandom;
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  }
});

test('AIService.generateShow handles old format by creating userView/systemData', async () => {
  const originalRandom = Math.random;
  const envKeys = ['GROQ_API_KEY', 'OPENAI_API_KEY'];
  const savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));

  const axios = require('axios');
  const originalPost = axios.post;

  try {
    process.env.GROQ_API_KEY = 'fake';
    delete process.env.OPENAI_API_KEY;
    Math.random = () => 0;

    axios.post = async () => ({
      data: {
        choices: [{
          message: {
            content: JSON.stringify({
              showName: 'Old',
              venue: 'V',
              durationSeconds: 10,
              notes: 'n',
              choreographyIdeas: []
            })
          }
        }]
      }
    });

    const aiService = loadFreshAIService();
    const result = await aiService.generateShow('Any');
    assert.equal(result.userView.showName, 'Old');
    assert.equal(result.systemData.showName, 'Old');
  } finally {
    axios.post = originalPost;
    Math.random = originalRandom;
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  }
});

test('AIService.generateShow falls back when required systemData fields are missing', async () => {
  const originalRandom = Math.random;
  const envKeys = ['GROQ_API_KEY', 'OPENAI_API_KEY'];
  const savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));

  const axios = require('axios');
  const originalPost = axios.post;

  try {
    process.env.GROQ_API_KEY = 'fake';
    delete process.env.OPENAI_API_KEY;
    Math.random = () => 0;

    axios.post = async () => ({
      data: {
        choices: [{
          message: {
            content: JSON.stringify({
              userView: { showName: 'X', venue: 'Y', durationSeconds: 10, concept: 'c', choreographyIdeas: [] },
              systemData: { durationSeconds: 10, notes: 'n', choreographyIdeas: [] } // missing showName/venue
            })
          }
        }]
      }
    });

    const aiService = loadFreshAIService();
    const result = await aiService.generateShow('Any');
    assert.ok(result.systemData.showName);
    assert.ok(result.systemData.venue);
  } finally {
    axios.post = originalPost;
    Math.random = originalRandom;
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  }
});

test('AIService.generateShow normalizes out-of-range drone positions', async () => {
  const originalRandom = Math.random;
  const envKeys = ['GROQ_API_KEY', 'OPENAI_API_KEY'];
  const savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));

  const axios = require('axios');
  const originalPost = axios.post;

  try {
    process.env.GROQ_API_KEY = 'fake';
    delete process.env.OPENAI_API_KEY;
    Math.random = () => 0;

    axios.post = async () => ({
      data: {
        choices: [{
          message: {
            content: JSON.stringify({
              userView: { showName: 'N', venue: 'V', durationSeconds: 10, concept: 'c', choreographyIdeas: [] },
              systemData: {
                showName: 'N',
                venue: 'V',
                durationSeconds: 10,
                notes: 'n',
                choreographyIdeas: [{
                  name: 'A',
                  description: 't',
                  durationSeconds: 10,
                  droneCount: 1,
                  dronePositions: [{
                    startPosition: { x: -100, y: 999, z: 500 },
                    endPosition: { x: 999, y: -50, z: 999 },
                    maxAltitude: 999
                  }]
                }]
              }
            })
          }
        }]
      }
    });

    const aiService = loadFreshAIService();
    const result = await aiService.generateShow('Any');
    const pos = result.systemData.choreographyIdeas[0].dronePositions[0];
    // after normalization, coordinates are in 0..20 / 0..10 ranges
    assert.ok(pos.startPosition.x >= 0 && pos.startPosition.x <= 20);
    assert.ok(pos.startPosition.y >= 0 && pos.startPosition.y <= 10);
    assert.ok(pos.startPosition.z >= 0 && pos.startPosition.z <= 20);
    assert.ok(pos.endPosition.x >= 0 && pos.endPosition.x <= 20);
    assert.ok(pos.endPosition.y >= 0 && pos.endPosition.y <= 10);
    assert.ok(pos.endPosition.z >= 0 && pos.endPosition.z <= 20);
    assert.ok(pos.maxAltitude <= 10);
  } finally {
    axios.post = originalPost;
    Math.random = originalRandom;
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  }
});

test('AIService.generateShow uses existing in-range positions and trims extras', async () => {
  const originalRandom = Math.random;
  const envKeys = ['GROQ_API_KEY', 'OPENAI_API_KEY'];
  const savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));

  const axios = require('axios');
  const originalPost = axios.post;

  try {
    process.env.GROQ_API_KEY = 'fake';
    delete process.env.OPENAI_API_KEY;
    Math.random = () => 0;

    axios.post = async () => ({
      data: {
        choices: [{
          message: {
            content: JSON.stringify({
              userView: { showName: 'S', venue: 'V', durationSeconds: 10, concept: 'c', choreographyIdeas: [] },
              systemData: {
                showName: 'S',
                venue: 'V',
                durationSeconds: 10,
                notes: 'n',
                choreographyIdeas: [{
                  name: 'A',
                  description: 't',
                  durationSeconds: 10,
                  droneCount: 1,
                  dronePositions: [
                    { startPosition: { x: 1, y: 1, z: 1 }, endPosition: { x: 2, y: 2, z: 2 }, maxAltitude: 5 },
                    { startPosition: { x: 3, y: 3, z: 3 }, endPosition: { x: 4, y: 4, z: 4 }, maxAltitude: 6 }
                  ]
                }]
              }
            })
          }
        }]
      }
    });

    const aiService = loadFreshAIService();
    const result = await aiService.generateShow('Any');
    assert.equal(result.systemData.choreographyIdeas[0].dronePositions.length, 1);
    assert.equal(result.systemData.choreographyIdeas[0].dronePositions[0].startPosition.x, 1);
  } finally {
    axios.post = originalPost;
    Math.random = originalRandom;
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  }
});

test('AIService.generateShow falls back to template when axios.post throws', async () => {
  const originalRandom = Math.random;
  const envKeys = ['GROQ_API_KEY', 'OPENAI_API_KEY'];
  const savedEnv = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));

  const axios = require('axios');
  const originalPost = axios.post;
  const loggerPath = require.resolve('../utils/logger');
  const originalLogger = require.cache[loggerPath];

  try {
    process.env.GROQ_API_KEY = 'fake';
    delete process.env.OPENAI_API_KEY;
    Math.random = () => 0;

    axios.post = async () => { throw new Error('net'); };

    // Silence expected error log in this test
    require.cache[loggerPath] = {
      id: loggerPath,
      filename: loggerPath,
      loaded: true,
      exports: { error: () => {}, warn: () => {}, info: () => {} }
    };

    const aiService = loadFreshAIService();
    const result = await aiService.generateShow('Any');
    assert.ok(result.userView);
    assert.ok(result.systemData);
  } finally {
    axios.post = originalPost;
    if (originalLogger) require.cache[loggerPath] = originalLogger;
    else delete require.cache[loggerPath];
    Math.random = originalRandom;
    for (const k of envKeys) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  }
});

