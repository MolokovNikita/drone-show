import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Autocomplete,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { fetchChoreographyById, fetchChoreographies, updateChoreography, createChoreography, setCurrent } from '../store/slices/choreographySlice';
import { fetchFlightPaths, bulkUpdateFlightPaths } from '../store/slices/flightPathSlice';
import { fetchShows } from '../store/slices/showSlice';
import { fetchDrones } from '../store/slices/droneSlice';
import DroneVisualization3D from '../components/DroneVisualization3D';

function ChoreographyEditorPage() {
  const { id, showId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { current: choreography, items: choreographies, loading } = useSelector((state) => state.choreographies);
  const { items: shows } = useSelector((state) => state.shows);
  const { items: drones } = useSelector((state) => state.drones);
  const { items: flightPaths } = useSelector((state) => state.flightPaths);

  const [formData, setFormData] = useState({
    choreographyName: '',
    showId: showId || '',
    durationSeconds: 300,
    droneCount: 0,
    sceneOrder: 1,
    status: 'draft',
  });

  const [selectedDrones, setSelectedDrones] = useState([]);
  const [dronePaths, setDronePaths] = useState({});
  const [editingPath, setEditingPath] = useState(null);
  const [pathDialogOpen, setPathDialogOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState({
    droneId: '',
    startPosition: { x: 0, y: 0, z: 0 },
    endPosition: { x: 10, y: 5, z: 10 },
    maxAltitude: 50,
    pathData: [],
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [droneSelectOpen, setDroneSelectOpen] = useState(false);
  const [droneSearchValue, setDroneSearchValue] = useState('');

  // Reset state when showId changes - this ensures 3D scene always shows current show
  useEffect(() => {
    if (!showId) return;

    console.log('🔄 [ChoreographyEditor] showId изменился, сбрасываю состояние...', showId);

    // Clear current choreography from Redux first
    dispatch(setCurrent(null));

    // Reset all local state when showId changes
    setSelectedDrones([]);
    setDronePaths({});
    setIsInitialized(false);
    setIsFormDirty(false);

    // This will trigger reload of choreographies for new show
    dispatch(fetchChoreographies({ showId }));
  }, [showId, dispatch]);

  useEffect(() => {
    console.log('🔄 [ChoreographyEditor] Начинаю загрузку данных...');
    console.log('📋 [ChoreographyEditor] Параметры URL - id:', id, 'showId:', showId);

    console.log('📺 [ChoreographyEditor] Загружаю шоу...');
    dispatch(fetchShows());

    console.log('🚁 [ChoreographyEditor] Загружаю дроны...');
    dispatch(fetchDrones());

    if (id) {
      console.log('🎭 [ChoreographyEditor] Загружаю хореографию по ID:', id);
      dispatch(fetchChoreographyById(id));
    } else if (showId) {
      console.log('🎭 [ChoreographyEditor] Загружаю хореографии для шоу:', showId);
      // Load choreographies for this show
      dispatch(fetchChoreographies({ showId }));
    }
  }, [dispatch, id, showId]);

  // Load existing choreography when showId is provided and we have choreographies
  useEffect(() => {
    console.log('🔍 [ChoreographyEditor] Проверяю хореографии для шоу:', showId);
    console.log('📊 [ChoreographyEditor] Всего хореографий загружено:', choreographies.length);
    console.log('📊 [ChoreographyEditor] Детали хореографий:', choreographies.map(c => ({
      choreographyId: c.choreographyId,
      showId: c.showId,
      showIdType: typeof c.showId,
      name: c.choreographyName
    })));
    console.log('⚙️ [ChoreographyEditor] isInitialized:', isInitialized);
    console.log('⚙️ [ChoreographyEditor] id из URL:', id);
    console.log('⚙️ [ChoreographyEditor] Текущая хореография:', choreography ? `ID: ${choreography.choreographyId}, showId: ${choreography.showId}` : 'null');

    // If showId changed and current choreography doesn't match, clear it
    if (showId && choreography && choreography.showId !== parseInt(showId)) {
      console.log('🔄 [ChoreographyEditor] showId изменился, текущая хореография не соответствует - очищаю');
      // Force clear by resetting - this will trigger reload
      setFormData({
        choreographyName: '',
        showId: showId,
        durationSeconds: 300,
        droneCount: 0,
        sceneOrder: 1,
        status: 'draft',
      });
      setSelectedDrones([]);
      setDronePaths({});
      setIsInitialized(false);
      // Don't return - continue to load new choreography
    }

    // Only process if we have showId but no id, and no current choreography loaded or it doesn't match
    if (showId && !id && (!choreography || (choreography && choreography.showId !== parseInt(showId)))) {
      if (choreographies.length > 0) {
        // Find all choreographies for this show (sorted by sceneOrder)
        const showIdNum = parseInt(showId);
        console.log('🔍 [ChoreographyEditor] Ищу хореографии для showId (число):', showIdNum);

        const showChoreographies = choreographies
          .filter((c) => {
            const cShowId = parseInt(c.showId);
            const matches = cShowId === showIdNum;
            if (!matches) {
              console.log(`  ❌ Хореография ${c.choreographyId}: showId=${cShowId} (тип: ${typeof c.showId}) не совпадает с ${showIdNum}`);
            } else {
              console.log(`  ✅ Хореография ${c.choreographyId}: showId=${cShowId} совпадает с ${showIdNum}`);
            }
            return matches;
          })
          .sort((a, b) => (a.sceneOrder || 0) - (b.sceneOrder || 0));

        console.log('✅ [ChoreographyEditor] Найдено хореографий для шоу', showId, ':', showChoreographies.length);
        console.log('📋 [ChoreographyEditor] Список хореографий:', showChoreographies);

        if (showChoreographies.length > 0) {
          const firstChoreography = showChoreographies[0];
          console.log('🎯 [ChoreographyEditor] Загружаю первую хореографию для шоу:', firstChoreography.choreographyId);
          dispatch(fetchChoreographyById(firstChoreography.choreographyId));
          setIsInitialized(true);
        } else {
          // No choreography exists for this show, initialize form with showId
          console.log('⚠️ [ChoreographyEditor] Хореография для шоу', showId, 'не найдена - инициализирую новую форму');
          if (!isInitialized) {
            setFormData({
              choreographyName: '',
              showId: showId,
              durationSeconds: 300,
              droneCount: 0,
              sceneOrder: 1,
              status: 'draft',
            });
            setIsInitialized(true);
          }
        }
      } else if (!isInitialized) {
        // Choreographies loaded but none found for this show
        console.log('⚠️ [ChoreographyEditor] Список хореографий пуст для шоу', showId);
        setFormData({
          choreographyName: '',
          showId: showId,
          durationSeconds: 300,
          droneCount: 0,
          sceneOrder: 1,
          status: 'draft',
        });
        setIsInitialized(true);
      }
    }
  }, [showId, id, choreographies, dispatch, isInitialized, choreography]);

  // Initialize form data when choreography is loaded (only once, unless form is not dirty)
  useEffect(() => {
    console.log('📝 [ChoreographyEditor] Проверяю данные формы...');
    console.log('📝 [ChoreographyEditor] choreography:', choreography ? `ID: ${choreography.choreographyId}` : 'null');
    console.log('📝 [ChoreographyEditor] isFormDirty:', isFormDirty);
    console.log('📝 [ChoreographyEditor] shows загружено:', shows.length);

    if (choreography && !isFormDirty) {
      // Verify that choreography belongs to the correct show if showId is provided
      if (showId && choreography.showId !== parseInt(showId)) {
        console.warn('❌ [ChoreographyEditor] Несоответствие showId! Ожидалось:', showId, 'Получено:', choreography.showId);
        // Don't set form data if there's a mismatch - wait for correct choreography
        return;
      }

      // Ensure showId exists in shows list before setting it
      const choreographyShowId = choreography.showId || showId;
      const showExists = shows.length > 0 && shows.some(s => s.showId === parseInt(choreographyShowId));

      console.log('✅ [ChoreographyEditor] Инициализирую данные формы для хореографии:', choreography.choreographyId);
      console.log('📋 [ChoreographyEditor] Данные хореографии:', {
        name: choreography.choreographyName,
        showId: choreographyShowId,
        duration: choreography.durationSeconds,
        droneCount: choreography.droneCount,
        sceneOrder: choreography.sceneOrder,
        status: choreography.status
      });

      setFormData({
        choreographyName: choreography.choreographyName || '',
        showId: showExists ? choreographyShowId : (shows.length > 0 ? shows[0].showId : ''),
        durationSeconds: choreography.durationSeconds || 300,
        droneCount: choreography.droneCount || 0,
        sceneOrder: choreography.sceneOrder || 1,
        status: choreography.status || 'draft',
      });
    } else if (showId && !choreography && !isFormDirty && isInitialized && shows.length > 0) {
      // If we have showId but no choreography, set the showId in form only if it exists in shows
      const showExists = shows.some(s => s.showId === parseInt(showId));
      if (showExists) {
        console.log('✅ [ChoreographyEditor] Устанавливаю showId в форме:', showId);
        setFormData((prev) => ({
          ...prev,
          showId: showId,
        }));
      } else {
        console.warn('⚠️ [ChoreographyEditor] Шоу', showId, 'не найдено в списке шоу');
      }
    }
  }, [choreography, showId, isFormDirty, isInitialized, shows]);

  // Load flight paths separately when choreography is loaded or showId changes
  useEffect(() => {
    // Clear flight paths when showId changes and choreography doesn't match
    if (showId && choreography && choreography.showId !== parseInt(showId)) {
      console.log('🔄 [ChoreographyEditor] showId изменился, очищаю flight paths');
      setSelectedDrones([]);
      setDronePaths({});
      return;
    }

    const choreographyId = id || choreography?.choreographyId;
    if (choreographyId) {
      console.log('🛤️ [ChoreographyEditor] Загружаю flight paths для хореографии:', choreographyId);
      // Always fetch flight paths, even if they're in choreography object
      // This ensures we have the latest data
      dispatch(fetchFlightPaths({ choreographyId: choreographyId.toString() }));
    } else {
      console.log('⏸️ [ChoreographyEditor] Нет ID хореографии, пропускаю загрузку flight paths');
    }
  }, [dispatch, id, showId, choreography?.choreographyId, choreography?.showId]);

  // Process flight paths when they are loaded
  useEffect(() => {
    const choreographyId = id || choreography?.choreographyId;
    console.log('🔄 [ChoreographyEditor] Обрабатываю flight paths...');
    console.log('🔄 [ChoreographyEditor] choreographyId:', choreographyId);
    console.log('🔄 [ChoreographyEditor] showId:', showId);
    console.log('🔄 [ChoreographyEditor] Всего flight paths в Redux:', flightPaths.length);
    console.log('🔄 [ChoreographyEditor] Flight paths в объекте choreography:', choreography?.flightPaths?.length || 0);

    // Check if choreography matches current showId
    if (showId && choreography && choreography.showId !== parseInt(showId)) {
      console.log('🔄 [ChoreographyEditor] Хореография не соответствует showId, сбрасываю');
      setSelectedDrones([]);
      setDronePaths({});
      return;
    }

    if (!choreographyId) {
      // Reset if no choreography
      console.log('⚠️ [ChoreographyEditor] Нет ID хореографии, сбрасываю дроны и пути');
      setSelectedDrones([]);
      setDronePaths({});
      return;
    }

    // Get flight paths from Redux store
    const pathsToUse = flightPaths.filter((fp) => {
      const fpChoreographyId = fp.choreographyId || fp.choreography_id;
      const matches = fpChoreographyId === parseInt(choreographyId) ||
        fpChoreographyId === choreographyId ||
        fpChoreographyId === choreographyId?.toString();
      return matches;
    });

    // Also check flight paths from choreography object (they might be there before Redux loads them)
    const pathsFromChoreography = choreography?.flightPaths || [];
    console.log('📊 [ChoreographyEditor] Пути из Redux store (отфильтрованные):', pathsToUse.length);
    console.log('📊 [ChoreographyEditor] Пути из объекта choreography:', pathsFromChoreography.length);

    // Use Redux paths if available, otherwise use paths from choreography object
    const allPaths = pathsToUse.length > 0 ? pathsToUse : pathsFromChoreography;

    console.log('📊 [ChoreographyEditor] Обработка flight paths для хореографии:', choreographyId);
    console.log('📊 [ChoreographyEditor] Всего путей для обработки:', allPaths.length);
    if (allPaths.length > 0) {
      console.log('📋 [ChoreographyEditor] Первые 3 пути:', allPaths.slice(0, 3).map(fp => ({
        pathId: fp.pathId || fp.path_id,
        droneId: fp.droneId || fp.drone_id,
        drone: fp.drone
      })));
    }

    if (allPaths && allPaths.length > 0) {
      console.log('✅ [ChoreographyEditor] Найдены пути, начинаю обработку...');
      const paths = {};
      const droneIds = [];

      allPaths.forEach((path, index) => {
        console.log(`🔍 [ChoreographyEditor] Обрабатываю путь ${index + 1}/${allPaths.length}:`, path);

        // Extract droneId - can be direct or from nested drone object
        // Try multiple possible field names and formats
        let droneId = path.droneId ||
          path.drone_id ||
          path.drone?.droneId ||
          path.drone?.drone_id ||
          (path.drone && typeof path.drone === 'object' ? path.drone.droneId || path.drone.drone_id : null);

        // If droneId is a number, convert to number for consistency
        if (droneId !== null && droneId !== undefined) {
          droneId = parseInt(droneId);
        }

        console.log('  📍 [ChoreographyEditor] path.droneId:', path.droneId);
        console.log('  📍 [ChoreographyEditor] path.drone_id:', path.drone_id);
        console.log('  📍 [ChoreographyEditor] path.drone:', path.drone);
        console.log('  ✅ [ChoreographyEditor] Извлеченный droneId:', droneId);

        if (droneId && !isNaN(droneId)) {
          // Parse JSON fields if they are strings
          let pathDataJson = path.pathDataJson || path.path_data_json || path.pathData;
          if (typeof pathDataJson === 'string') {
            try {
              pathDataJson = JSON.parse(pathDataJson);
            } catch (e) {
              console.warn('⚠️ [ChoreographyEditor] Ошибка парсинга pathDataJson:', e);
              pathDataJson = [];
            }
          }

          let startPosition = path.startPosition || path.start_position;
          if (typeof startPosition === 'string') {
            try {
              startPosition = JSON.parse(startPosition);
            } catch (e) {
              console.warn('⚠️ [ChoreographyEditor] Ошибка парсинга startPosition:', e);
              startPosition = { x: 0, y: 0, z: 0 };
            }
          }

          let endPosition = path.endPosition || path.end_position;
          if (typeof endPosition === 'string') {
            try {
              endPosition = JSON.parse(endPosition);
            } catch (e) {
              console.warn('⚠️ [ChoreographyEditor] Ошибка парсинга endPosition:', e);
              endPosition = { x: 10, y: 5, z: 10 };
            }
          }

          paths[droneId] = {
            pathId: path.pathId || path.path_id,
            startPosition: startPosition,
            endPosition: endPosition,
            maxAltitude: path.maxAltitude || path.max_altitude || 50,
            pathDataJson: pathDataJson || [],
          };
          if (!droneIds.includes(droneId)) {
            droneIds.push(droneId);
          }
          console.log(`  ✅ [ChoreographyEditor] Путь для дрона ${droneId} обработан`);
        } else {
          console.warn('⚠️ [ChoreographyEditor] Не удалось извлечь droneId из пути:', path);
        }
      });

      console.log('📋 [ChoreographyEditor] Итоговые droneIds:', droneIds);
      console.log('📋 [ChoreographyEditor] Итоговый объект paths:', Object.keys(paths).length, 'путей');
      console.log('📋 [ChoreographyEditor] Детали paths:', Object.entries(paths).map(([id, path]) => ({
        droneId: id,
        hasStartPos: !!path.startPosition,
        hasEndPos: !!path.endPosition,
        pathDataLength: Array.isArray(path.pathDataJson) ? path.pathDataJson.length : 0
      })));

      if (droneIds.length > 0) {
        console.log(`✅ [ChoreographyEditor] Устанавливаю ${droneIds.length} дронов в selectedDrones`);
        setDronePaths(paths);
        // Ensure we create a new array to trigger React re-render
        setSelectedDrones([...droneIds]);
        console.log(`✅ [ChoreographyEditor] Успешно установлено ${droneIds.length} дронов:`, droneIds);
      } else {
        console.warn('⚠️ [ChoreographyEditor] Не найдено валидных ID дронов в flight paths');
        console.warn('⚠️ [ChoreographyEditor] Проверьте структуру flight paths:', allPaths);
        // Reset if no valid drones found
        setSelectedDrones([]);
        setDronePaths({});
      }
    } else {
      console.log('⚠️ [ChoreographyEditor] Flight paths не найдены для хореографии:', choreographyId);
      // Reset if no paths found
      setSelectedDrones([]);
      setDronePaths({});
    }
  }, [flightPaths, choreography, id, showId]);

  const handleSave = async () => {
    try {
      const choreographyData = {
        ...formData,
        droneCount: selectedDrones.length,
      };

      let choreographyId = id || choreography?.choreographyId;
      let savedChoreography;

      if (!choreographyId) {
        savedChoreography = await dispatch(createChoreography(choreographyData)).unwrap();
        choreographyId = savedChoreography.choreographyId;
      } else {
        savedChoreography = await dispatch(updateChoreography({ id: choreographyId, data: choreographyData })).unwrap();
      }

      // Save flight paths
      const pathsToSave = selectedDrones.map((droneId) => {
        const existing = dronePaths[droneId];
        if (existing) {
          // Ensure pathDataJson is generated if missing
          let pathDataJson = existing.pathDataJson;
          if (!pathDataJson || (Array.isArray(pathDataJson) && pathDataJson.length === 0)) {
            pathDataJson = generatePathData(existing.startPosition, existing.endPosition);
          }

          return {
            droneId,
            startPosition: existing.startPosition,
            endPosition: existing.endPosition,
            maxAltitude: existing.maxAltitude,
            pathDataJson: pathDataJson,
            collisionCheckStatus: 'pending',
          };
        } else {
          const defaultStart = { x: 0, y: 0, z: 0 };
          const defaultEnd = { x: 10, y: 5, z: 10 };
          return {
            droneId,
            startPosition: defaultStart,
            endPosition: defaultEnd,
            maxAltitude: 50,
            pathDataJson: generatePathData(defaultStart, defaultEnd),
            collisionCheckStatus: 'pending',
          };
        }
      });

      if (pathsToSave.length > 0) {
        await dispatch(bulkUpdateFlightPaths({ choreographyId, flightPaths: pathsToSave })).unwrap();
      }

      // Reload choreography and flight paths to get updated data
      const updatedChoreography = await dispatch(fetchChoreographyById(choreographyId)).unwrap();
      await dispatch(fetchFlightPaths({ choreographyId: choreographyId.toString() }));

      // Update form data with saved choreography
      if (updatedChoreography) {
        setFormData({
          choreographyName: updatedChoreography.choreographyName || '',
          showId: updatedChoreography.showId || showId || '',
          durationSeconds: updatedChoreography.durationSeconds || 300,
          droneCount: updatedChoreography.droneCount || 0,
          sceneOrder: updatedChoreography.sceneOrder || 1,
          status: updatedChoreography.status || 'draft',
        });
      }

      setIsFormDirty(false);
      alert('Choreography saved successfully!');
    } catch (error) {
      console.error('Error saving choreography:', error);
      alert('Failed to save choreography: ' + (error.message || 'Unknown error'));
    }
  };

  const generatePathData = (start, end, steps = 50) => {
    const path = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      path.push({
        time: t * formData.durationSeconds,
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        z: start.z + (end.z - start.z) * t,
      });
    }
    return path;
  };

  const handleAddDrone = (droneId) => {
    console.log('➕ [ChoreographyEditor] handleAddDrone вызван с droneId:', droneId);
    console.log('➕ [ChoreographyEditor] Текущий selectedDrones:', selectedDrones);
    if (!selectedDrones.includes(droneId)) {
      const newSelectedDrones = [...selectedDrones, droneId];
      console.log('➕ [ChoreographyEditor] Обновляю selectedDrones на:', newSelectedDrones);
      setSelectedDrones(newSelectedDrones);
      if (!dronePaths[droneId]) {
        setDronePaths({
          ...dronePaths,
          [droneId]: {
            startPosition: { x: selectedDrones.length * 2, y: 0, z: 0 },
            endPosition: { x: selectedDrones.length * 2, y: 5, z: 10 },
            maxAltitude: 50,
            pathDataJson: [],
          },
        });
      }
      setIsFormDirty(true);
    } else {
      console.log('⚠️ [ChoreographyEditor] Дрон уже выбран:', droneId);
    }
  };

  const handleRemoveDrone = (droneId) => {
    setSelectedDrones(selectedDrones.filter((id) => id !== droneId));
    const newPaths = { ...dronePaths };
    delete newPaths[droneId];
    setDronePaths(newPaths);
    setIsFormDirty(true);
  };

  const handleEditPath = (droneId) => {
    const path = dronePaths[droneId];
    setCurrentPath({
      droneId,
      startPosition: path?.startPosition || { x: 0, y: 0, z: 0 },
      endPosition: path?.endPosition || { x: 10, y: 5, z: 10 },
      maxAltitude: path?.maxAltitude || 50,
      pathData: path?.pathDataJson || [],
    });
    setEditingPath(droneId);
    setPathDialogOpen(true);
  };

  const handleSavePath = () => {
    const pathData = generatePathData(currentPath.startPosition, currentPath.endPosition);
    setDronePaths({
      ...dronePaths,
      [currentPath.droneId]: {
        ...dronePaths[currentPath.droneId],
        startPosition: currentPath.startPosition,
        endPosition: currentPath.endPosition,
        maxAltitude: currentPath.maxAltitude,
        pathDataJson: pathData,
      },
    });
    setIsFormDirty(true);
    setPathDialogOpen(false);
    setEditingPath(null);
  };

  const selectedShow = shows.find((s) => s.showId === parseInt(formData.showId));

  // Log current state
  const dronePathsCount = Object.keys(dronePaths).length;
  useEffect(() => {
    console.log('📊 [ChoreographyEditor] Текущее состояние:');
    console.log('  🚁 Дроны загружено:', drones.length);
    console.log('  📺 Шоу загружено:', shows.length);
    console.log('  🎭 Хореография:', choreography ? `ID: ${choreography.choreographyId}` : 'null');
    console.log('  🛤️ Flight paths загружено:', flightPaths.length);
    console.log('  ✅ Выбрано дронов:', selectedDrones.length);
    console.log('  📋 Пути дронов:', dronePathsCount);
  }, [drones.length, shows.length, choreography?.choreographyId, flightPaths.length, selectedDrones.length, dronePathsCount]);

  // Get drones for visualization - filter by show/choreography
  const visualizationDrones = useMemo(() => {
    // If we have selected drones, use them
    if (selectedDrones.length > 0) {
      return drones.filter((d) => selectedDrones.includes(d.droneId));
    }

    // Otherwise, get drones from flightPaths of this choreography
    if (choreography && choreography.flightPaths && choreography.flightPaths.length > 0) {
      const choreographyDroneIds = choreography.flightPaths
        .map((fp) => fp.droneId || fp.drone?.droneId)
        .filter(Boolean);
      return drones.filter((d) => choreographyDroneIds.includes(d.droneId));
    }

    // If choreography has droneCount but no flightPaths yet, show first N drones
    if (choreography && choreography.droneCount > 0 && (!choreography.flightPaths || choreography.flightPaths.length === 0)) {
      return drones.slice(0, choreography.droneCount);
    }

    // Or get drones from flightPaths of all choreographies in the show
    if (formData.showId) {
      const showChoreographies = choreographies.filter(
        (c) => c.showId === parseInt(formData.showId)
      );
      const showDroneIds = new Set();
      let totalDroneCount = 0;

      showChoreographies.forEach((choreo) => {
        if (choreo.flightPaths && choreo.flightPaths.length > 0) {
          choreo.flightPaths.forEach((fp) => {
            const droneId = fp.droneId || fp.drone?.droneId;
            if (droneId) showDroneIds.add(droneId);
          });
        } else if (choreo.droneCount > 0) {
          // If choreography has droneCount but no flightPaths, count it
          totalDroneCount += choreo.droneCount;
        }
      });

      if (showDroneIds.size > 0) {
        return drones.filter((d) => showDroneIds.has(d.droneId));
      } else if (totalDroneCount > 0) {
        // If we have total drone count but no flightPaths, show first N drones
        return drones.slice(0, Math.min(totalDroneCount, drones.length));
      }
    }

    // If no show/choreography context, return empty array (don't show all drones)
    return [];
  }, [selectedDrones, drones, choreography, choreographies, formData.showId]);

  // Memoize available drones for Autocomplete
  const availableDrones = useMemo(() => {
    const filtered = drones && Array.isArray(drones)
      ? drones.filter((d) => d && d.droneId && !selectedDrones.includes(d.droneId))
      : [];
    return filtered;
  }, [drones, selectedDrones]);

  // Log drones state for debugging
  useEffect(() => {
    console.log('🔍 [ChoreographyEditor] Состояние дронов:', {
      total: drones.length,
      selected: selectedDrones.length,
      available: availableDrones.length,
      dronesArray: drones.slice(0, 3).map(d => ({ id: d.droneId, serial: d.serialNumber, model: d.model }))
    });
  }, [drones.length, selectedDrones.length, availableDrones.length]);

  // Log selected drones count for debugging
  useEffect(() => {
    console.log('📊 [ChoreographyEditor] Обновление счетчика дронов:', selectedDrones.length, 'selectedDrones:', selectedDrones);
  }, [selectedDrones]);

  // Memoize drones header text to ensure it updates
  // Show count of drones that will be visualized (selected or all if none selected)
  const dronesHeaderText = useMemo(() => {
    const count = visualizationDrones.length;
    return `Drones (${count})`;
  }, [visualizationDrones.length]);

  // Convert dronePaths object to array format expected by DroneVisualization3D
  // Also include flight paths from Redux store if they exist
  const flightPathsArray = useMemo(() => {
    if (selectedDrones.length > 0) {
      return selectedDrones.map((droneId) => {
        const path = dronePaths[droneId];
        if (path) {
          // Ensure pathDataJson is an array
          let pathDataJson = path.pathDataJson;
          if (typeof pathDataJson === 'string') {
            try {
              pathDataJson = JSON.parse(pathDataJson);
            } catch (e) {
              pathDataJson = [];
            }
          }
          if (!Array.isArray(pathDataJson)) {
            pathDataJson = [];
          }

          return {
            droneId,
            pathId: path.pathId,
            startPosition: path.startPosition,
            endPosition: path.endPosition,
            maxAltitude: path.maxAltitude,
            pathDataJson: pathDataJson,
          };
        }
        return null;
      }).filter(Boolean);
    }

    // If no selected drones, use flight paths from Redux store or choreography
    const choreographyId = id || choreography?.choreographyId;
    if (!choreographyId) return [];

    return flightPaths
      .filter((fp) => {
        const fpChoreographyId = fp.choreographyId || fp.choreography_id;
        const choreographyId = id || choreography?.choreographyId;
        return fpChoreographyId === parseInt(choreographyId) ||
          fpChoreographyId === choreographyId ||
          fpChoreographyId === choreographyId?.toString();
      })
      .map((fp) => {
        const droneId = fp.droneId || fp.drone_id || fp.drone?.droneId || fp.drone?.drone_id;
        if (!droneId) return null;

        let pathDataJson = fp.pathDataJson || fp.path_data_json || fp.pathData;
        if (typeof pathDataJson === 'string') {
          try {
            pathDataJson = JSON.parse(pathDataJson);
          } catch (e) {
            pathDataJson = [];
          }
        }
        if (!Array.isArray(pathDataJson)) {
          pathDataJson = [];
        }

        let startPosition = fp.startPosition || fp.start_position;
        if (typeof startPosition === 'string') {
          try {
            startPosition = JSON.parse(startPosition);
          } catch (e) {
            startPosition = { x: 0, y: 0, z: 0 };
          }
        }

        let endPosition = fp.endPosition || fp.end_position;
        if (typeof endPosition === 'string') {
          try {
            endPosition = JSON.parse(endPosition);
          } catch (e) {
            endPosition = { x: 10, y: 5, z: 10 };
          }
        }

        // Убеждаемся, что pathDataJson это массив
        let finalPathDataJson = pathDataJson;
        if (!Array.isArray(finalPathDataJson)) {
          console.warn('⚠️ [ChoreographyEditor] pathDataJson не массив, преобразую:', typeof finalPathDataJson);
          finalPathDataJson = [];
        }

        return {
          droneId: parseInt(droneId),
          pathId: fp.pathId || fp.path_id,
          startPosition: startPosition || { x: 0, y: 0, z: 0 },
          endPosition: endPosition || { x: 10, y: 5, z: 10 },
          maxAltitude: fp.maxAltitude || fp.max_altitude || 50,
          pathDataJson: finalPathDataJson,
        };
      })
      .filter(Boolean);
  }, [selectedDrones, dronePaths, flightPaths, id, choreography?.choreographyId]);

  // Log visualization data for debugging
  useEffect(() => {
    console.log('🎨 [ChoreographyEditor] ========== ДАННЫЕ ДЛЯ ВИЗУАЛИЗАЦИИ ДРОНОВ ==========');
    console.log('  📊 Всего дронов для отрисовки:', visualizationDrones.length);
    console.log('  📊 Всего flight paths для отрисовки:', flightPathsArray.length);
    console.log('  🚁 Дроны для визуализации:');
    visualizationDrones.forEach((drone, index) => {
      console.log(`    ${index + 1}. Drone ID: ${drone.droneId}`);
      console.log(`       Serial: ${drone.serialNumber || 'N/A'}`);
      console.log(`       Model: ${drone.model || 'N/A'}`);
      console.log(`       Status: ${drone.status || 'N/A'}`);
    });
    console.log('  🛤️ Flight Paths для визуализации:');
    flightPathsArray.forEach((fp, index) => {
      console.log(`    ${index + 1}. Path для Drone ID: ${fp.droneId}`);
      console.log(`       Path ID: ${fp.pathId || 'N/A'}`);
      console.log(`       Start Position:`, fp.startPosition);
      console.log(`       End Position:`, fp.endPosition);
      console.log(`       Max Altitude: ${fp.maxAltitude}m`);
      console.log(`       Path Data Points: ${Array.isArray(fp.pathDataJson) ? fp.pathDataJson.length : 0}`);
    });
    console.log('  🎭 Хореография:', choreography ? {
      choreographyId: choreography.choreographyId,
      name: choreography.choreographyName,
      showId: choreography.showId
    } : 'null');
    console.log('🎨 [ChoreographyEditor] ====================================================');
  }, [visualizationDrones, flightPathsArray, choreography]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/shows')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {id || choreography ? 'Edit Choreography' : 'Create Choreography'}
          </Typography>
          {selectedShow && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Show: {selectedShow.showName}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
        >
          Save Choreography
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Choreography Details
            </Typography>
            <TextField
              fullWidth
              margin="normal"
              required
              label="Name"
              value={formData.choreographyName}
              onChange={(e) => {
                setFormData({ ...formData, choreographyName: e.target.value });
                setIsFormDirty(true);
              }}
            />
            <TextField
              fullWidth
              margin="normal"
              select
              required
              label="Show"
              value={shows.length > 0 && shows.some(s => s.showId === parseInt(formData.showId)) ? formData.showId : ''}
              onChange={(e) => {
                setFormData({ ...formData, showId: e.target.value });
                setIsFormDirty(true);
              }}
              error={formData.showId && shows.length > 0 && !shows.some(s => s.showId === parseInt(formData.showId))}
              helperText={formData.showId && shows.length > 0 && !shows.some(s => s.showId === parseInt(formData.showId)) ? 'Show not found in list' : ''}
            >
              <MenuItem value="">Select Show</MenuItem>
              {shows.map((show) => (
                <MenuItem key={show.showId} value={show.showId}>
                  {show.showName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              margin="normal"
              required
              type="number"
              label="Duration (seconds)"
              value={formData.durationSeconds}
              onChange={(e) => {
                setFormData({ ...formData, durationSeconds: parseInt(e.target.value) || 300 });
                setIsFormDirty(true);
              }}
            />
            <TextField
              fullWidth
              margin="normal"
              required
              type="number"
              label="Scene Order"
              value={formData.sceneOrder}
              onChange={(e) => {
                setFormData({ ...formData, sceneOrder: parseInt(e.target.value) || 1 });
                setIsFormDirty(true);
              }}
            />
            <TextField
              fullWidth
              margin="normal"
              select
              label="Status"
              value={formData.status}
              onChange={(e) => {
                setFormData({ ...formData, status: e.target.value });
                setIsFormDirty(true);
              }}
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
          </Paper>

          <div style={{
            padding: '24px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h6 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 600,
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                lineHeight: 1.6
              }}>
                {dronesHeaderText}
              </h6>
              <div style={{ position: 'relative', minWidth: '200px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={droneSearchValue}
                    onChange={(e) => {
                      setDroneSearchValue(e.target.value);
                      setDroneSelectOpen(true);
                    }}
                    onFocus={(e) => {
                      setDroneSelectOpen(true);
                      e.target.style.borderColor = '#1976d2';
                      e.target.style.borderWidth = '2px';
                    }}
                    onBlur={(e) => {
                      // Delay to allow click on option
                      setTimeout(() => setDroneSelectOpen(false), 200);
                      e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)';
                      e.target.style.borderWidth = '1px';
                    }}
                    placeholder={drones && drones.length > 0 ? "Выберите дрон" : "Загрузка дронов..."}
                    disabled={!drones || drones.length === 0}
                    style={{
                      width: '100%',
                      padding: '8.5px 14px',
                      paddingRight: '40px',
                      fontSize: '14px',
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      borderRadius: '8px',
                      outline: 'none',
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!e.target.disabled && document.activeElement !== e.target) {
                        e.target.style.borderColor = 'rgba(0, 0, 0, 0.87)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.target.disabled && document.activeElement !== e.target) {
                        e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setDroneSelectOpen(!droneSelectOpen)}
                    disabled={!drones || drones.length === 0}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'rgba(0, 0, 0, 0.54)',
                      transition: 'transform 0.2s',
                      transformOrigin: 'center',
                      transform: droneSelectOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)'
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </button>
                </div>
                {droneSelectOpen && availableDrones.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: '#fff',
                    border: '1px solid rgba(0, 0, 0, 0.23)',
                    borderRadius: '8px',
                    boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000
                  }}>
                    {availableDrones
                      .filter((drone) => {
                        if (!droneSearchValue) return true;
                        const searchLower = droneSearchValue.toLowerCase();
                        const label = `${drone.serialNumber || `Drone ${drone.droneId}`} - ${drone.model || 'Unknown'}`;
                        return label.toLowerCase().includes(searchLower);
                      })
                      .map((drone) => (
                        <div
                          key={drone.droneId}
                          onClick={() => {
                            console.log('➕ [ChoreographyEditor] Добавляю дрон:', drone.droneId, drone.serialNumber);
                            handleAddDrone(drone.droneId);
                            setDroneSearchValue('');
                            setDroneSelectOpen(false);
                          }}
                          style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                            fontSize: '14px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                        >
                          {drone.serialNumber || `Drone ${drone.droneId}`} - {drone.model || 'Unknown'}
                        </div>
                      ))}
                    {availableDrones.filter((drone) => {
                      if (!droneSearchValue) return true;
                      const searchLower = droneSearchValue.toLowerCase();
                      const label = `${drone.serialNumber || `Drone ${drone.droneId}`} - ${drone.model || 'Unknown'}`;
                      return label.toLowerCase().includes(searchLower);
                    }).length === 0 && (
                        <div style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: 'rgba(0, 0, 0, 0.54)',
                          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                          fontSize: '14px'
                        }}>
                          {drones && drones.length > 0 ? "Все дроны уже выбраны" : "Загрузка дронов..."}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
            <hr style={{
              margin: '16px 0',
              border: 'none',
              borderTop: '1px solid rgba(0, 0, 0, 0.12)'
            }} />
            {visualizationDrones.length > 0 ? (
              visualizationDrones.map((drone) => {
                const droneId = drone.droneId;
                const path = dronePaths[droneId];
                const isSelected = selectedDrones.includes(droneId);
                return (
                  <div
                    key={droneId}
                    style={{
                      marginBottom: '16px',
                      padding: '16px',
                      backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.04)' : '#fff',
                      border: isSelected ? '1px solid rgba(25, 118, 210, 0.5)' : '1px solid rgba(0, 0, 0, 0.12)',
                      borderRadius: '8px',
                      boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 500,
                          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {drone.serialNumber || `Drone ${droneId}`}
                          {isSelected && (
                            <span style={{
                              fontSize: '12px',
                              padding: '2px 6px',
                              backgroundColor: '#1976d2',
                              color: '#fff',
                              borderRadius: '12px',
                              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                            }}>
                              Selected
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(0, 0, 0, 0.6)',
                          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                          marginBottom: path ? '8px' : '0'
                        }}>
                          {drone.model || ''} {drone.status && `• ${drone.status}`}
                        </div>
                        {path && (
                          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              fontSize: '12px',
                              backgroundColor: 'rgba(0, 0, 0, 0.08)',
                              borderRadius: '16px',
                              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                              color: 'rgba(0, 0, 0, 0.87)'
                            }}>
                              Max Alt: {path.maxAltitude}m
                            </span>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              fontSize: '12px',
                              backgroundColor: 'rgba(0, 0, 0, 0.08)',
                              borderRadius: '16px',
                              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                              color: 'rgba(0, 0, 0, 0.87)'
                            }}>
                              Path: {path.pathDataJson?.length || 0} points
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {isSelected && path && (
                          <button
                            type="button"
                            onClick={() => handleEditPath(droneId)}
                            style={{
                              padding: '8px',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              color: '#1976d2',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = 'rgba(25, 118, 210, 0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                            }}
                            title="Edit Path"
                          >
                            <EditIcon fontSize="small" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              handleRemoveDrone(droneId);
                            } else {
                              handleAddDrone(droneId);
                            }
                          }}
                          style={{
                            padding: '8px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: isSelected ? '#d32f2f' : '#1976d2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = isSelected
                              ? 'rgba(211, 47, 47, 0.08)'
                              : 'rgba(25, 118, 210, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                          title={isSelected ? "Remove Drone" : "Add Drone"}
                        >
                          {isSelected ? (
                            <DeleteIcon fontSize="small" />
                          ) : (
                            <AddIcon fontSize="small" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{
                textAlign: 'center',
                padding: '16px 0',
                color: 'rgba(0, 0, 0, 0.6)',
                fontSize: '14px',
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                margin: 0
              }}>
                No drones selected. Add drones to create flight paths.
              </p>
            )}
          </div>
        </Grid>

        <Grid item xs={12} md={8}>
          <DroneVisualization3D
            drones={visualizationDrones}
            choreography={choreography}
            flightPaths={flightPathsArray}
            showId={formData.showId}
            showName={selectedShow?.showName || 'No Show Selected'}
            choreographyName={choreography?.choreographyName || 'No Choreography'}
          />
        </Grid>
      </Grid>

      <Dialog open={pathDialogOpen} onClose={() => setPathDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Flight Path</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Drone: {drones.find((d) => d.droneId === currentPath.droneId)?.serialNumber || 'Unknown'}
          </Typography>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Start Position</Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="X"
                value={currentPath.startPosition.x}
                onChange={(e) =>
                  setCurrentPath({
                    ...currentPath,
                    startPosition: { ...currentPath.startPosition, x: parseFloat(e.target.value) || 0 },
                  })
                }
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Y (Altitude)"
                value={currentPath.startPosition.y}
                onChange={(e) =>
                  setCurrentPath({
                    ...currentPath,
                    startPosition: { ...currentPath.startPosition, y: parseFloat(e.target.value) || 0 },
                  })
                }
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Z"
                value={currentPath.startPosition.z}
                onChange={(e) =>
                  setCurrentPath({
                    ...currentPath,
                    startPosition: { ...currentPath.startPosition, z: parseFloat(e.target.value) || 0 },
                  })
                }
              />
            </Grid>
          </Grid>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>End Position</Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="X"
                value={currentPath.endPosition.x}
                onChange={(e) =>
                  setCurrentPath({
                    ...currentPath,
                    endPosition: { ...currentPath.endPosition, x: parseFloat(e.target.value) || 0 },
                  })
                }
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Y (Altitude)"
                value={currentPath.endPosition.y}
                onChange={(e) =>
                  setCurrentPath({
                    ...currentPath,
                    endPosition: { ...currentPath.endPosition, y: parseFloat(e.target.value) || 0 },
                  })
                }
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                type="number"
                label="Z"
                value={currentPath.endPosition.z}
                onChange={(e) =>
                  setCurrentPath({
                    ...currentPath,
                    endPosition: { ...currentPath.endPosition, z: parseFloat(e.target.value) || 0 },
                  })
                }
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="Max Altitude (meters)"
            value={currentPath.maxAltitude}
            onChange={(e) => setCurrentPath({ ...currentPath, maxAltitude: parseFloat(e.target.value) || 50 })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPathDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePath} variant="contained">
            Save Path
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ChoreographyEditorPage;

