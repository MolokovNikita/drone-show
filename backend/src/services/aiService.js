require('dotenv').config();
const axios = require('axios');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    // Используем Groq API (бесплатный и быстрый)
    // Можно также использовать Hugging Face или OpenAI
    this.apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    this.apiUrl = process.env.GROQ_API_KEY 
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    this.model = process.env.GROQ_API_KEY ? 'llama-3.1-8b-instant' : 'gpt-3.5-turbo';
  }

  async generateShow(prompt) {
    try {
      if (!this.apiKey) {
        // Если нет API ключа, возвращаем шаблонное шоу
        logger.warn('AI API key not found, using template show');
        return this.generateTemplateShow(prompt);
      }

      const systemPrompt = `You are a creative assistant that generates drone light show concepts. 
You MUST respond ONLY with a valid JSON object. Do not include any text before or after the JSON.

The JSON must have TWO parts:
1. "userView" - Beautiful, creative description for the user (concept, vision, inspiration)
2. "systemData" - Technical data for the system to create the show

CRITICAL: In systemData, each choreography MUST include "dronePositions" array with EXACT positions for EACH drone.
Each position must have: startPosition {x, y, z}, endPosition {x, y, z}, and maxAltitude.

The JSON structure:
{
  "userView": {
    "showName": "Creative show name",
    "venue": "Location description",
    "durationSeconds": 300,
    "concept": "Beautiful, inspiring description of the show concept, theme, and visual effects for the user",
    "choreographyIdeas": [
      {
        "name": "Choreography name",
        "description": "Creative, inspiring description of what happens in this choreography for the user",
        "durationSeconds": 60,
        "droneCount": 10
      }
    ]
  },
  "systemData": {
    "showName": "Show name (same as userView)",
    "venue": "Venue location",
    "durationSeconds": 300,
    "notes": "Technical notes and implementation details for the system",
    "choreographyIdeas": [
      {
        "name": "Choreography name",
        "description": "Technical description for system implementation",
        "durationSeconds": 60,
        "droneCount": 10,
        "dronePositions": [
          {
            "startPosition": {"x": 0, "y": 0, "z": 5},
            "endPosition": {"x": 5, "y": 3, "z": 10},
            "maxAltitude": 8
          },
          {
            "startPosition": {"x": 5, "y": 0, "z": 5},
            "endPosition": {"x": 10, "y": 3, "z": 10},
            "maxAltitude": 8
          }
        ]
      }
    ]
  }
}

IMPORTANT: 
- dronePositions array MUST have EXACTLY droneCount items
- Each position must have valid x, y, z coordinates
- CRITICAL: Coordinates must be in this range for 3D visualization:
  * x: 0-20 (horizontal plane, left-right)
  * y: 0-10 (vertical height, up-down)
  * z: 0-20 (horizontal plane, forward-backward)
- maxAltitude: 5-10 (should match or be less than y coordinate range)
- Keep coordinates within these limits to ensure proper visualization
- Return ONLY the JSON object, no additional text or explanations.`;

      // Добавляем инструкцию о формате JSON к пользовательскому промпту
      const enhancedPrompt = `${prompt || 'Generate a creative drone light show'}

IMPORTANT: Respond with a valid JSON object only, using this exact structure:
{
  "userView": {
    "showName": "string - creative name",
    "venue": "string - location",
    "durationSeconds": number,
    "concept": "string - beautiful, inspiring description for user",
    "choreographyIdeas": [
      {
        "name": "string",
        "description": "string - creative description for user",
        "durationSeconds": number,
        "droneCount": number
      }
    ]
  },
  "systemData": {
    "showName": "string",
    "venue": "string",
    "durationSeconds": number,
    "notes": "string - technical notes for system",
    "choreographyIdeas": [
      {
        "name": "string",
        "description": "string - technical description",
        "durationSeconds": number,
        "droneCount": number,
        "dronePositions": [
          {
            "startPosition": {"x": number, "y": number, "z": number},
            "endPosition": {"x": number, "y": number, "z": number},
            "maxAltitude": number
          }
        ]
      }
    ]
  }
}

CRITICAL: 
- For each choreography, dronePositions array MUST have EXACTLY droneCount items
- Each position needs startPosition {x, y, z}, endPosition {x, y, z}, maxAltitude
- IMPORTANT: Coordinates must be in this range for 3D visualization:
  * x: 0-20 (horizontal plane, left-right)
  * y: 0-10 (vertical height, up-down)
  * z: 0-20 (horizontal plane, forward-backward)
- maxAltitude: 5-10 (should match or be less than y coordinate range)
- Keep coordinates within these limits to ensure proper visualization

Return ONLY the JSON, no other text.`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: enhancedPrompt }
          ],
          temperature: 0.8,
          max_tokens: 4000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      
      // Логируем полный ответ от ИИ в консоль
      console.log('\n🤖 ========== AI RESPONSE ==========');
      console.log('📝 Full AI Response:');
      console.log(content);
      console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
      console.log('🤖 ===================================\n');
      logger.info('AI Response received', { content, responseData: response.data });
      
      // Пытаемся извлечь JSON из ответа
      let parsedResponse;
      try {
        // Ищем JSON в ответе - пытаемся найти полный JSON
        let jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          let jsonStr = jsonMatch[0];
          
          // Пытаемся распарсить
          try {
            parsedResponse = JSON.parse(jsonStr);
          } catch (e) {
            // Если JSON обрезан, пытаемся восстановить его
            logger.warn('JSON appears to be truncated, attempting to fix...');
            
            // Пытаемся найти и закрыть незакрытые массивы и объекты
            let openBraces = (jsonStr.match(/\{/g) || []).length;
            let closeBraces = (jsonStr.match(/\}/g) || []).length;
            let openBrackets = (jsonStr.match(/\[/g) || []).length;
            let closeBrackets = (jsonStr.match(/\]/g) || []).length;
            
            // Закрываем незакрытые структуры
            while (openBrackets > closeBrackets) {
              jsonStr += ']';
              closeBrackets++;
            }
            while (openBraces > closeBraces) {
              jsonStr += '}';
              closeBraces++;
            }
            
            try {
              parsedResponse = JSON.parse(jsonStr);
            } catch (e2) {
              throw new Error('Could not fix truncated JSON');
            }
          }
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        logger.warn('Failed to parse AI response as JSON, using template', { error: parseError.message });
        const template = this.generateTemplateShow(prompt);
        // Преобразуем шаблон в новый формат
        return {
          userView: template.userView,
          systemData: template.systemData
        };
      }

      // Проверяем, что parsedResponse не пустой
      if (!parsedResponse || Object.keys(parsedResponse).length === 0) {
        logger.warn('Parsed response is empty, using template');
        const template = this.generateTemplateShow(prompt);
        return {
          userView: template.userView,
          systemData: template.systemData
        };
      }

      // Проверяем наличие обеих частей, если нет - создаем из одной
      if (!parsedResponse.userView || !parsedResponse.systemData) {
        // Если пришел старый формат, создаем оба объекта
        if (parsedResponse.showName) {
          return {
            userView: {
              showName: parsedResponse.showName,
              venue: parsedResponse.venue,
              durationSeconds: parsedResponse.durationSeconds,
              concept: parsedResponse.notes || parsedResponse.concept || 'A beautiful drone light show',
              choreographyIdeas: parsedResponse.choreographyIdeas || []
            },
            systemData: {
              showName: parsedResponse.showName,
              venue: parsedResponse.venue,
              durationSeconds: parsedResponse.durationSeconds,
              notes: parsedResponse.notes || 'Generated show',
              choreographyIdeas: parsedResponse.choreographyIdeas || []
            }
          };
        }
        // Если формат неправильный, используем шаблон
        logger.warn('Invalid response format, using template');
        const template = this.generateTemplateShow(prompt);
        return {
          userView: template.userView,
          systemData: template.systemData
        };
      }

      // Генерируем позиции дронов, если их нет или недостаточно
      const generateDronePositions = (count, existingPositions = []) => {
        const positions = [];
        const spacing = 10;
        const rows = Math.ceil(Math.sqrt(count));
        
        for (let i = 0; i < count; i++) {
          if (existingPositions[i]) {
            // Используем существующую позицию
            positions.push(existingPositions[i]);
          } else {
            // Генерируем новую позицию
            const row = Math.floor(i / rows);
            const col = i % rows;
            positions.push({
              startPosition: { x: col * spacing, y: 0, z: 10 + row * 5 },
              endPosition: { x: col * spacing + 5, y: 5, z: 15 + row * 5 },
              maxAltitude: 20 + row * 2
            });
          }
        }
        return positions;
      };

      // Проверяем наличие обязательных полей
      if (!parsedResponse.systemData.showName || !parsedResponse.systemData.venue) {
        logger.warn('Missing required fields (showName or venue), using template');
        const template = this.generateTemplateShow(prompt);
        return {
          userView: template.userView,
          systemData: template.systemData
        };
      }

      // Нормализуем координаты дронов к разумному диапазону для визуализации
      const normalizePosition = (pos) => {
        // Нормализуем координаты к диапазону: x: 0-20, y: 0-10, z: 0-20
        // Это соответствует размеру gridHelper (20x20) в визуализации
        const maxX = 20;
        const maxY = 10;
        const maxZ = 20;
        
        // Находим минимальные и максимальные значения для нормализации
        let minX = Infinity, maxXVal = -Infinity;
        let minY = Infinity, maxYVal = -Infinity;
        let minZ = Infinity, maxZVal = -Infinity;
        
        // Сначала находим диапазон всех координат
        if (pos.startPosition) {
          minX = Math.min(minX, pos.startPosition.x || 0);
          maxXVal = Math.max(maxXVal, pos.startPosition.x || 0);
          minY = Math.min(minY, pos.startPosition.y || 0);
          maxYVal = Math.max(maxYVal, pos.startPosition.y || 0);
          minZ = Math.min(minZ, pos.startPosition.z || 0);
          maxZVal = Math.max(maxZVal, pos.startPosition.z || 0);
        }
        if (pos.endPosition) {
          minX = Math.min(minX, pos.endPosition.x || 0);
          maxXVal = Math.max(maxXVal, pos.endPosition.x || 0);
          minY = Math.min(minY, pos.endPosition.y || 0);
          maxYVal = Math.max(maxYVal, pos.endPosition.y || 0);
          minZ = Math.min(minZ, pos.endPosition.z || 0);
          maxZVal = Math.max(maxZVal, pos.endPosition.z || 0);
        }
        
        // Если значения уже в разумном диапазоне, не нормализуем
        if (maxXVal <= maxX && maxYVal <= maxY && maxZVal <= maxZ && 
            minX >= 0 && minY >= 0 && minZ >= 0) {
          return pos;
        }
        
        // Нормализуем координаты
        const rangeX = maxXVal - minX || 1;
        const rangeY = maxYVal - minY || 1;
        const rangeZ = maxZVal - minZ || 1;
        
        const normalized = {
          startPosition: pos.startPosition ? {
            x: ((pos.startPosition.x || 0) - minX) / rangeX * maxX,
            y: ((pos.startPosition.y || 0) - minY) / rangeY * maxY,
            z: ((pos.startPosition.z || 0) - minZ) / rangeZ * maxZ
          } : { x: 0, y: 0, z: 0 },
          endPosition: pos.endPosition ? {
            x: ((pos.endPosition.x || 0) - minX) / rangeX * maxX,
            y: ((pos.endPosition.y || 0) - minY) / rangeY * maxY,
            z: ((pos.endPosition.z || 0) - minZ) / rangeZ * maxZ
          } : { x: 10, y: 5, z: 10 },
          maxAltitude: pos.maxAltitude ? Math.min(pos.maxAltitude, maxY) : maxY
        };
        
        return normalized;
      };

      // Убеждаемся, что у каждой хореографии есть позиции дронов
      if (parsedResponse.systemData.choreographyIdeas) {
        parsedResponse.systemData.choreographyIdeas = parsedResponse.systemData.choreographyIdeas.map(idea => {
          const droneCount = idea.droneCount || 10;
          let existingPositions = idea.dronePositions || [];
          
          // Нормализуем существующие позиции
          if (existingPositions.length > 0) {
            // Находим общий диапазон для всех позиций в этой хореографии
            let allPositions = [...existingPositions];
            if (allPositions.length < droneCount) {
              // Дополняем недостающие позиции
              const additional = generateDronePositions(droneCount - allPositions.length);
              allPositions = [...allPositions, ...additional];
            }
            
            // Находим общий диапазон для нормализации
            let minX = Infinity, maxXVal = -Infinity;
            let minY = Infinity, maxYVal = -Infinity;
            let minZ = Infinity, maxZVal = -Infinity;
            
            allPositions.forEach(pos => {
              if (pos.startPosition) {
                minX = Math.min(minX, pos.startPosition.x || 0);
                maxXVal = Math.max(maxXVal, pos.startPosition.x || 0);
                minY = Math.min(minY, pos.startPosition.y || 0);
                maxYVal = Math.max(maxYVal, pos.startPosition.y || 0);
                minZ = Math.min(minZ, pos.startPosition.z || 0);
                maxZVal = Math.max(maxZVal, pos.startPosition.z || 0);
              }
              if (pos.endPosition) {
                minX = Math.min(minX, pos.endPosition.x || 0);
                maxXVal = Math.max(maxXVal, pos.endPosition.x || 0);
                minY = Math.min(minY, pos.endPosition.y || 0);
                maxYVal = Math.max(maxYVal, pos.endPosition.y || 0);
                minZ = Math.min(minZ, pos.endPosition.z || 0);
                maxZVal = Math.max(maxZVal, pos.endPosition.z || 0);
              }
            });
            
            const maxX = 20;
            const maxY = 10;
            const maxZ = 20;
            
            // Если значения уже в разумном диапазоне, не нормализуем
            const needsNormalization = maxXVal > maxX || maxYVal > maxY || maxZVal > maxZ || 
                                      minX < 0 || minY < 0 || minZ < 0;
            
            if (needsNormalization) {
              const rangeX = maxXVal - minX || 1;
              const rangeY = maxYVal - minY || 1;
              const rangeZ = maxZVal - minZ || 1;
              
              existingPositions = allPositions.slice(0, droneCount).map(pos => ({
                startPosition: pos.startPosition ? {
                  x: ((pos.startPosition.x || 0) - minX) / rangeX * maxX,
                  y: ((pos.startPosition.y || 0) - minY) / rangeY * maxY,
                  z: ((pos.startPosition.z || 0) - minZ) / rangeZ * maxZ
                } : { x: 0, y: 0, z: 0 },
                endPosition: pos.endPosition ? {
                  x: ((pos.endPosition.x || 0) - minX) / rangeX * maxX,
                  y: ((pos.endPosition.y || 0) - minY) / rangeY * maxY,
                  z: ((pos.endPosition.z || 0) - minZ) / rangeZ * maxZ
                } : { x: 10, y: 5, z: 10 },
                maxAltitude: pos.maxAltitude ? Math.min(pos.maxAltitude, maxY) : maxY
              }));
            } else {
              existingPositions = allPositions.slice(0, droneCount);
            }
          }
          
          // Если позиций нет или их меньше чем нужно, генерируем
          if (existingPositions.length < droneCount) {
            idea.dronePositions = generateDronePositions(droneCount, existingPositions);
          } else if (existingPositions.length > droneCount) {
            // Если позиций больше чем нужно, обрезаем
            idea.dronePositions = existingPositions.slice(0, droneCount);
          } else {
            idea.dronePositions = existingPositions;
          }
          
          return idea;
        });
      }

      return parsedResponse;
    } catch (error) {
      logger.error('AI generation error:', error);
      // В случае ошибки возвращаем шаблонное шоу
      const template = this.generateTemplateShow(prompt);
      return {
        userView: template.userView,
        systemData: template.systemData
      };
    }
  }

  generateTemplateShow(prompt) {
    const themes = [
      'Starry Night',
      'Ocean Waves',
      'Fireworks Display',
      'Butterfly Dance',
      'Geometric Patterns',
      'Space Journey',
      'Flower Bloom',
      'Dragon Flight'
    ];

    const venues = [
      'City Center Plaza',
      'Beachfront Park',
      'Stadium',
      'Concert Hall',
      'Park Amphitheater',
      'Waterfront',
      'Mountain View',
      'Urban Square'
    ];

    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const randomVenue = venues[Math.floor(Math.random() * venues.length)];

    const concept = `A beautiful ${randomTheme.toLowerCase()} themed drone light show featuring synchronized movements and colorful patterns. The show creates mesmerizing visual effects in the night sky.`;
    
    // Helper function to generate drone positions
    const generateDronePositions = (count) => {
      const positions = [];
      const spacing = 10;
      const rows = Math.ceil(Math.sqrt(count));
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / rows);
        const col = i % rows;
        positions.push({
          startPosition: { x: col * spacing, y: 0, z: 10 + row * 5 },
          endPosition: { x: col * spacing + 5, y: 5, z: 15 + row * 5 },
          maxAltitude: 20 + row * 2
        });
      }
      return positions;
    };
    
    const choreo1Count = 10;
    const choreo2Count = 15;
    const choreo3Count = 20;
    
    return {
      userView: {
        showName: prompt ? `${prompt} - ${randomTheme}` : `${randomTheme} Show`,
        venue: randomVenue,
        durationSeconds: 300,
        concept: concept,
        choreographyIdeas: [
          {
            name: 'Opening Formation',
            description: 'Drones gracefully form an initial mesmerizing pattern in the sky, creating a stunning visual introduction',
            durationSeconds: 60,
            droneCount: choreo1Count
          },
          {
            name: 'Main Sequence',
            description: 'Complex synchronized movements and patterns that create a breathtaking dance of light in the night sky',
            durationSeconds: 120,
            droneCount: choreo2Count
          },
          {
            name: 'Finale',
            description: 'Grand finale with all drones creating a spectacular display that leaves the audience in awe',
            durationSeconds: 60,
            droneCount: choreo3Count
          }
        ]
      },
      systemData: {
        showName: prompt ? `${prompt} - ${randomTheme}` : `${randomTheme} Show`,
        venue: randomVenue,
        durationSeconds: 300,
        notes: concept,
        choreographyIdeas: [
          {
            name: 'Opening Formation',
            description: 'Drones form an initial pattern in the sky',
            durationSeconds: 60,
            droneCount: choreo1Count,
            dronePositions: generateDronePositions(choreo1Count)
          },
          {
            name: 'Main Sequence',
            description: 'Complex synchronized movements and patterns',
            durationSeconds: 120,
            droneCount: choreo2Count,
            dronePositions: generateDronePositions(choreo2Count)
          },
          {
            name: 'Finale',
            description: 'Grand finale with all drones creating a spectacular display',
            durationSeconds: 60,
            droneCount: choreo3Count,
            dronePositions: generateDronePositions(choreo3Count)
          }
        ]
      }
    };
  }
}

module.exports = new AIService();

