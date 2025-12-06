import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  TheaterComedy as ShowIcon,
  Settings as SettingsIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';
import { fetchShows, createShow, updateShow, deleteShow, generateShowWithAI } from '../store/slices/showSlice';
import { fetchProjects } from '../store/slices/projectSlice';
import api from '../services/api';
import AIChat from '../components/AIChat';

function ShowsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: shows, loading: showsLoading } = useSelector((state) => state.shows);
  const { items: projects, loading: projectsLoading } = useSelector((state) => state.projects);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    showName: '',
    projectId: '',
    showDate: '',
    showTime: '',
    venue: '',
    weatherConditions: '',
    crowdSize: '',
    durationSeconds: '',
    status: 'scheduled',
    notes: '',
  });

  useEffect(() => {
    if (!showsLoading && shows.length === 0) {
      dispatch(fetchShows());
    }
    if (!projectsLoading && projects.length === 0) {
      dispatch(fetchProjects());
    }
  }, [dispatch, showsLoading, shows.length, projectsLoading, projects.length]);

  const handleOpen = (show = null) => {
    if (show) {
      setEditing(show);
      setFormData({
        showName: show.showName || '',
        projectId: show.projectId || '',
        showDate: show.showDate || '',
        showTime: show.showTime || '',
        venue: show.venue || '',
        weatherConditions: show.weatherConditions || '',
        crowdSize: show.crowdSize || '',
        durationSeconds: show.durationSeconds || '',
        status: show.status || 'scheduled',
        notes: show.notes || '',
      });
    } else {
      setEditing(null);
      setFormData({
        showName: '',
        projectId: '',
        showDate: '',
        showTime: '',
        venue: '',
        weatherConditions: '',
        crowdSize: '',
        durationSeconds: '',
        status: 'scheduled',
        notes: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleConfirmShow = async (systemData) => {
    // systemData передается напрямую из AIChat компонента
    if (!systemData) {
      // Fallback: ищем последнее сообщение с systemData
      const lastAIMessage = chatMessages
        .filter(m => m.role === 'assistant' && m.systemData)
        .slice(-1)[0];
      
      if (!lastAIMessage || !lastAIMessage.systemData) {
        alert('Нет данных для создания шоу');
        return;
      }
      
      // Если шоу уже создано, просто перенаправляем
      if (lastAIMessage.showId) {
        navigate(`/choreography/show/${lastAIMessage.showId}`);
        setChatOpen(false);
        return;
      }
      
      systemData = lastAIMessage.systemData;
    }

    // Проверяем, не создано ли уже шоу с этими данными
    const existingMessage = chatMessages
      .filter(m => m.role === 'assistant' && m.systemData && m.showId)
      .find(m => {
        // Проверяем, соответствует ли systemData текущему
        return m.systemData.showName === systemData.showName &&
               JSON.stringify(m.systemData.choreographyIdeas) === JSON.stringify(systemData.choreographyIdeas);
      });
    
    if (existingMessage && existingMessage.showId) {
      navigate(`/choreography/show/${existingMessage.showId}`);
      setChatOpen(false);
      return;
    }

    // Используем переданные systemData для создания шоу
    try {
      setGenerating(true);
      
      console.log('🎬 [ShowsPage] Создаю шоу с systemData:', {
        showName: systemData.showName,
        venue: systemData.venue,
        durationSeconds: systemData.durationSeconds,
        choreographyIdeas: systemData.choreographyIdeas?.map(c => ({
          name: c.name,
          droneCount: c.droneCount,
          durationSeconds: c.durationSeconds,
        })),
      });
      
      // Создаем шоу напрямую с сохраненными данными
      const showData = {
        showName: systemData.showName,
        venue: systemData.venue,
        durationSeconds: systemData.durationSeconds || 300,
        notes: systemData.notes,
        showDate: formData.showDate || new Date().toISOString().split('T')[0],
        showTime: formData.showTime || '20:00:00',
        status: 'scheduled',
        projectId: formData.projectId || null,
      };
      
      console.log('📝 [ShowsPage] Данные для создания шоу:', showData);

      const createdShow = await dispatch(createShow(showData)).unwrap();
      
      if (createdShow?.showId) {
        // Создаем хореографии из choreographyIdeas
        if (systemData.choreographyIdeas && systemData.choreographyIdeas.length > 0) {
          console.log('🎭 [ShowsPage] Создаю хореографии из systemData:', {
            count: systemData.choreographyIdeas.length,
            ideas: systemData.choreographyIdeas.map(c => ({
              name: c.name,
              droneCount: c.droneCount,
              durationSeconds: c.durationSeconds,
              hasPositions: !!c.dronePositions,
              positionsCount: c.dronePositions?.length || 0,
            })),
          });
          
          try {
            // Получаем доступные дроны
            const dronesResponse = await api.get('/drones', { params: { status: 'active' } });
            const availableDrones = dronesResponse.data?.items || dronesResponse.data || [];
            console.log(`🚁 [ShowsPage] Доступно дронов: ${availableDrones.length}`);
            
            // Функция для получения дронов (дублируем если нужно)
            const getDronesForChoreography = (requiredCount) => {
              const drones = [];
              if (availableDrones.length === 0) {
                console.warn('⚠️ [ShowsPage] Нет доступных дронов!');
                return drones;
              }
              
              // Используем доступные дроны, дублируя их если нужно
              for (let i = 0; i < requiredCount; i++) {
                const droneIndex = i % availableDrones.length;
                drones.push(availableDrones[droneIndex]);
              }
              
              console.log(`  📊 Требуется дронов: ${requiredCount}, Используется: ${drones.length} (уникальных: ${new Set(drones.map(d => d.droneId)).size})`);
              return drones;
            };
            
             // Функция для генерации pathDataJson из позиций
             const generatePathData = (startPos, endPos, durationSeconds = 60) => {
               const steps = 50; // Больше точек для плавной анимации
               const path = [];
               for (let i = 0; i <= steps; i++) {
                 const t = i / steps;
                 const timeInSeconds = t * durationSeconds; // Время в секундах, не нормализованное
                 path.push({
                   x: startPos.x + (endPos.x - startPos.x) * t,
                   y: startPos.y + (endPos.y - startPos.y) * t,
                   z: startPos.z + (endPos.z - startPos.z) * t,
                   time: timeInSeconds // Используем 'time' вместо 'timestamp' и в секундах
                 });
               }
               return path;
             };
            
            for (let i = 0; i < systemData.choreographyIdeas.length; i++) {
              const idea = systemData.choreographyIdeas[i];
              const requiredDroneCount = idea.droneCount || 10;
              console.log(`  📝 Создаю хореографию ${i + 1}: ${idea.name} (дронов: ${requiredDroneCount})`);
              
              const choreographyData = {
                showId: createdShow.showId,
                choreographyName: idea.name,
                durationSeconds: idea.durationSeconds || 60,
                droneCount: requiredDroneCount,
                sceneOrder: i + 1,
                status: 'draft',
              };
              
              console.log('  📋 Данные хореографии:', choreographyData);
              
              const createdChoreo = await api.post('/choreographies', choreographyData);
              const choreographyId = createdChoreo.data?.choreographyId || createdChoreo.data?.id;
              console.log('  ✅ Хореография создана:', choreographyId);
              
              // Получаем дроны для этой хореографии
              const drones = getDronesForChoreography(requiredDroneCount);
              
              if (drones.length > 0) {
                // Создаем FlightPath для каждого дрона
                const flightPaths = [];
                const dronePositions = idea.dronePositions || [];
                
                // Если позиций меньше чем нужно, дополняем дефолтными
                const generateDefaultPosition = (index) => {
                  const spacing = 10;
                  const rows = Math.ceil(Math.sqrt(requiredDroneCount));
                  const row = Math.floor(index / rows);
                  const col = index % rows;
                  return {
                    startPosition: { x: col * spacing, y: 0, z: 10 + row * 5 },
                    endPosition: { x: col * spacing + 5, y: 5, z: 15 + row * 5 },
                    maxAltitude: 20 + row * 2
                  };
                };
                
                 for (let j = 0; j < drones.length; j++) {
                   const drone = drones[j];
                   // Используем позицию из AI, если есть, иначе генерируем дефолтную
                   const position = dronePositions[j] || generateDefaultPosition(j);
                   
                   const pathDataJson = generatePathData(
                     position.startPosition,
                     position.endPosition,
                     idea.durationSeconds || 60 // Передаем длительность хореографии
                   );
                  
                  flightPaths.push({
                    droneId: drone.droneId,
                    startPosition: position.startPosition,
                    endPosition: position.endPosition,
                    maxAltitude: position.maxAltitude,
                    pathDataJson: pathDataJson,
                    collisionCheckStatus: 'pending',
                  });
                }
                
                  // Создаем все FlightPath через bulk update
                if (flightPaths.length > 0) {
                  console.log(`  🛤️  Создаю ${flightPaths.length} flight paths для хореографии ${choreographyId}`);
                  await api.post('/flight-paths/bulk', {
                    choreographyId,
                    flightPaths
                  });
                  console.log(`  ✅ Flight paths созданы для хореографии ${choreographyId}`);
                }
              } else {
                console.warn(`  ⚠️ Нет дронов для создания flight paths для хореографии ${choreographyId}`);
              }
            }
            console.log('✅ [ShowsPage] Все хореографии созданы успешно');
          } catch (choreoError) {
            console.error('❌ [ShowsPage] Ошибка при создании хореографий:', choreoError);
            // Продолжаем даже если хореографии не создались
          }
        } else {
          console.warn('⚠️ [ShowsPage] Нет choreographyIdeas в systemData для создания хореографий');
        }
        
        // Обновляем последнее сообщение с ID созданного шоу
        setChatMessages((prev) => 
          prev.map((msg, idx) => {
            const lastIndex = prev.length - 1;
            if (idx === lastIndex && msg.role === 'assistant') {
              return { ...msg, showId: createdShow.showId };
            }
            return msg;
          })
        );
        
        // Перенаправляем на страницу редактирования хореографии
        navigate(`/choreography/show/${createdShow.showId}`);
        setChatOpen(false);
        dispatch(fetchShows());
      } else {
        alert('Шоу создано, но не удалось перейти. Обновите страницу.');
      }
    } catch (error) {
      console.error('Error confirming show:', error);
      alert('Ошибка при создании шоу: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setGenerating(false);
    }
  };

  const handleChatMessage = async (message) => {
    // Добавляем сообщение пользователя в чат
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    try {
      setGenerating(true);
      // НЕ создаем шоу сразу, только генерируем данные (create: false)
      const generateData = {
        prompt: message || 'Generate a creative drone light show',
        projectId: formData.projectId || null,
        showDate: formData.showDate || new Date().toISOString().split('T')[0],
        showTime: formData.showTime || '20:00:00',
        create: false // Только предпросмотр, не создаем шоу
      };
      
      const result = await dispatch(generateShowWithAI(generateData)).unwrap();
      
      console.log('📋 [ShowsPage] Результат от ИИ:', {
        hasUserView: !!result.userView,
        hasSystemData: !!result.systemData,
        userViewShowName: result.userView?.showName,
        systemDataShowName: result.systemData?.showName,
        choreographyIdeasCount: result.systemData?.choreographyIdeas?.length || 0,
      });
      
      // Добавляем ответ ИИ в чат
      // Показываем userView пользователю, но сохраняем systemData для подтверждения
      const aiMessage = {
        role: 'assistant',
        content: result.userView || {
          showName: result.show?.showName,
          venue: result.show?.venue,
          durationSeconds: result.show?.durationSeconds,
          concept: result.show?.notes,
          choreographyIdeas: result.choreographyIdeas || [],
        },
        systemData: result.systemData || {
          showName: result.show?.showName,
          venue: result.show?.venue,
          durationSeconds: result.show?.durationSeconds,
          notes: result.show?.notes,
          choreographyIdeas: result.choreographyIdeas || [],
        },
        showId: result.show?.showId || null, // null, так как шоу еще не создано
        timestamp: new Date().toISOString(),
      };
      
      console.log('💾 [ShowsPage] Сохраняю сообщение ИИ с systemData:', {
        showName: aiMessage.systemData?.showName,
        choreographyIdeas: aiMessage.systemData?.choreographyIdeas?.map(c => c.name),
      });
      
      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating show:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to generate show. Please try again.'}`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        crowdSize: formData.crowdSize ? parseInt(formData.crowdSize) : null,
        durationSeconds: formData.durationSeconds ? parseInt(formData.durationSeconds) : 300,
      };
      
      if (editing) {
        await dispatch(updateShow({ id: editing.showId, data: submitData })).unwrap();
      } else {
        await dispatch(createShow(submitData)).unwrap();
      }
      handleClose();
      dispatch(fetchShows());
    } catch (error) {
      console.error('Error saving show:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this show?')) {
      try {
        await dispatch(deleteShow(id)).unwrap();
        dispatch(fetchShows());
      } catch (error) {
        console.error('Error deleting show:', error);
      }
    }
  };

  const handleStartShow = async (showId) => {
    try {
      await api.put(`/shows/${showId}`, { status: 'in_progress' });
      dispatch(fetchShows());
    } catch (error) {
      console.error('Error starting show:', error);
    }
  };

  const handleStopShow = async (showId) => {
    try {
      await api.put(`/shows/${showId}`, { status: 'completed' });
      dispatch(fetchShows());
    } catch (error) {
      console.error('Error stopping show:', error);
    }
  };

  const getStatusColor = (status) => {
    const statusStyles = {
      scheduled: {
        backgroundColor: '#e0f2fe',
        color: '#0369a1',
        border: '1px solid #7dd3fc',
        fontWeight: 600,
      },
      in_progress: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fcd34d',
        fontWeight: 600,
      },
      completed: {
        backgroundColor: '#d1fae5',
        color: '#065f46',
        border: '1px solid #6ee7b7',
        fontWeight: 600,
      },
      cancelled: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fca5a5',
        fontWeight: 600,
      },
    };
    return statusStyles[status] || {
      backgroundColor: '#f3f4f6',
      color: '#6b7280',
      border: '1px solid #e5e7eb',
      fontWeight: 600,
    };
  };

  const stats = {
    total: shows.length,
    scheduled: shows.filter(s => s.status === 'scheduled').length,
    inProgress: shows.filter(s => s.status === 'in_progress').length,
    completed: shows.filter(s => s.status === 'completed').length,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Shows
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{ mr: 2 }}
        >
          New Show
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<AIIcon />}
          onClick={() => {
            setChatOpen(true);
            if (chatMessages.length === 0) {
              setChatMessages([{
                role: 'assistant',
                content: 'Привет! Я могу помочь вам создать креативные световые шоу дронов. Опишите, какое шоу вы хотите, и я создам его для вас.',
                timestamp: new Date().toISOString(),
              }]);
            }
          }}
        >
          AI Chat
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShowIcon sx={{ fontSize: 40, color: '#2563eb', mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Shows
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShowIcon sx={{ fontSize: 40, color: '#3b82f6', mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.scheduled}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Scheduled
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShowIcon sx={{ fontSize: 40, color: '#f59e0b', mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.inProgress}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShowIcon sx={{ fontSize: 40, color: '#10b981', mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stats.completed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Venue</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shows.map((show) => (
              <TableRow key={show.showId}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {show.showName}
                  </Typography>
                </TableCell>
                <TableCell>{show.project?.projectName || 'N/A'}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {show.showDate
                      ? new Date(show.showDate).toLocaleDateString()
                      : 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {show.showTime || ''}
                  </Typography>
                </TableCell>
                <TableCell>{show.venue || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={show.status}
                    size="small"
                    sx={getStatusColor(show.status)}
                  />
                </TableCell>
                <TableCell>
                  {show.durationSeconds
                    ? `${Math.floor(show.durationSeconds / 60)} min`
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {show.status === 'scheduled' && (
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleStartShow(show.showId)}
                      title="Start Show"
                    >
                      <PlayIcon fontSize="small" />
                    </IconButton>
                  )}
                  {show.status === 'in_progress' && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleStopShow(show.showId)}
                      title="Stop Show"
                    >
                      <StopIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => navigate(`/choreography/show/${show.showId}`)}
                    title="Edit Choreography"
                  >
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpen(show)}
                    title="Edit Show"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(show.showId)}
                    title="Delete Show"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editing ? 'Edit Show' : 'Create New Show'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            required
            label="Show Name"
            value={formData.showName}
            onChange={(e) => setFormData({ ...formData, showName: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            select
            label="Project"
            value={formData.projectId}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            SelectProps={{ native: true }}
          >
            <option value="">Select Project</option>
            {projects.map((project) => (
              <option key={project.projectId} value={project.projectId}>
                {project.projectName}
              </option>
            ))}
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            required
            label="Show Date"
            type="date"
            value={formData.showDate}
            onChange={(e) => setFormData({ ...formData, showDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            required
            label="Show Time"
            type="time"
            value={formData.showTime}
            onChange={(e) => setFormData({ ...formData, showTime: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            margin="normal"
            required
            label="Venue"
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Weather Conditions"
            value={formData.weatherConditions}
            onChange={(e) => setFormData({ ...formData, weatherConditions: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Crowd Size"
            type="number"
            value={formData.crowdSize}
            onChange={(e) => setFormData({ ...formData, crowdSize: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            required
            label="Duration (seconds)"
            type="number"
            value={formData.durationSeconds}
            onChange={(e) => setFormData({ ...formData, durationSeconds: e.target.value })}
          />
          <TextField
            fullWidth
            margin="normal"
            select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            SelectProps={{ native: true }}
          >
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="Notes"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={chatOpen} 
        onClose={() => setChatOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <AIChat
            messages={chatMessages}
            onSendMessage={handleChatMessage}
            isLoading={generating}
            onClose={() => setChatOpen(false)}
            onConfirmShow={handleConfirmShow}
            lastShowData={chatMessages.filter(m => m.role === 'assistant' && m.systemData).pop()?.systemData}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default ShowsPage;
