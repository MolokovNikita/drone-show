const { Show, Project, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const aiService = require('../services/aiService');

class ShowController {
  async getAll(req, res, next) {
    try {
      const { status, projectId, search } = req.query;
      const where = {};

      if (status) {
        where.status = status;
      }

      if (projectId) {
        where.projectId = projectId;
      }

      if (search) {
        where[Op.or] = [
          { showName: { [Op.iLike]: `%${search}%` } },
          { venue: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const shows = await Show.findAll({
        where,
        include: [
          { model: Project, as: 'project' }
        ],
        order: [['show_date', 'DESC']]
      });

      res.json({ items: shows });
    } catch (error) {
      logger.error('Get shows error:', error);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const show = await Show.findByPk(req.params.id, {
        include: [
          { model: Project, as: 'project' }
        ]
      });

      if (!show) {
        return res.status(404).json({ error: 'Show not found' });
      }

      res.json(show);
    } catch (error) {
      logger.error('Get show error:', error);
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const show = await Show.create(req.body);
      const created = await Show.findByPk(show.showId, {
        include: [
          { model: Project, as: 'project' }
        ]
      });
      res.status(201).json(created);
    } catch (error) {
      logger.error('Create show error:', error);
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const show = await Show.findByPk(req.params.id);
      if (!show) {
        return res.status(404).json({ error: 'Show not found' });
      }

      await show.update(req.body);
      const updated = await Show.findByPk(show.showId, {
        include: [
          { model: Project, as: 'project' }
        ]
      });
      res.json(updated);
    } catch (error) {
      logger.error('Update show error:', error);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const show = await Show.findByPk(req.params.id);
      if (!show) {
        return res.status(404).json({ error: 'Show not found' });
      }

      await show.destroy();
      res.status(204).send();
    } catch (error) {
      logger.error('Delete show error:', error);
      next(error);
    }
  }

  async generateWithAI(req, res, next) {
    try {
      const { prompt, projectId, create = false } = req.body;
      
      console.log('\n🎬 ========== GENERATING SHOW WITH AI ==========');
      console.log('📝 User Prompt:', prompt || 'No prompt provided');
      console.log('📋 Project ID:', projectId || 'None');
      console.log('📅 Show Date:', req.body.showDate || 'Not specified');
      console.log('⏰ Show Time:', req.body.showTime || 'Not specified');
      console.log('💾 Create Show:', create ? 'YES' : 'NO (preview only)');
      
      // Генерируем шоу через AI
      const aiResponse = await aiService.generateShow(prompt);
      
      console.log('\n✅ AI Response Received:');
      console.log('👤 User View:', JSON.stringify(aiResponse.userView, null, 2));
      console.log('⚙️  System Data:', JSON.stringify(aiResponse.systemData, null, 2));
      console.log('🎬 ============================================\n');
      
      // Создаем шоу только если явно запрошено (create = true)
      let createdShow = null;
      if (create) {
        const systemData = aiResponse.systemData;
        
        // Проверяем наличие обязательных полей
        if (!systemData || !systemData.showName || !systemData.venue) {
          logger.error('AI response missing required fields', { systemData });
          return res.status(400).json({ 
            error: 'AI response is invalid or incomplete',
            details: 'Missing showName or venue in systemData'
          });
        }
        
        const showData = {
          showName: systemData.showName,
          venue: systemData.venue,
          durationSeconds: systemData.durationSeconds || 300,
          notes: systemData.notes || '',
          showDate: req.body.showDate || new Date().toISOString().split('T')[0],
          showTime: req.body.showTime || '20:00:00',
          status: 'scheduled',
          projectId: projectId || null,
          weatherConditions: null,
          crowdSize: null
        };

        const show = await Show.create(showData);
        createdShow = await Show.findByPk(show.showId, {
          include: [
            { model: Project, as: 'project' }
          ]
        });
        
        console.log('✅ Show created with ID:', createdShow.showId);
      }

      // Возвращаем userView для отображения пользователю и systemData для системы
      res.status(200).json({
        show: createdShow, // null если не создано
        userView: aiResponse.userView, // Красивое описание для пользователя
        systemData: aiResponse.systemData, // Технические данные для системы
        choreographyIdeas: aiResponse.systemData.choreographyIdeas || []
      });
    } catch (error) {
      logger.error('Generate show with AI error:', error);
      next(error);
    }
  }
}

module.exports = new ShowController();
