import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { Box, Paper, Typography, Button, IconButton } from '@mui/material';
import { PlayArrow, Pause, Stop } from '@mui/icons-material';
import * as THREE from 'three';

function Drone({ position, color = '#2563eb', label, targetPosition, isAnimating, pathData = null, animationTime = 0, duration = 300 }) {
  const meshRef = useRef();
  const [currentPosition, setCurrentPosition] = useState(position);

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (isAnimating && pathData && Array.isArray(pathData) && pathData.length > 0) {
        // Use path data for precise animation
        const normalizedTime = (animationTime % duration) / duration;
        const targetTime = normalizedTime * duration;
        
        // Find the closest point in path data
        let currentPoint = pathData[0];
        let nextPoint = pathData[pathData.length - 1];
        
        // Поддерживаем как 'time', так и 'timestamp' для обратной совместимости
        const getTime = (point) => {
          if (point.time !== undefined) return point.time;
          if (point.timestamp !== undefined) return point.timestamp * duration;
          return 0;
        };
        
        for (let i = 0; i < pathData.length - 1; i++) {
          const currentTime = getTime(pathData[i]);
          const nextTime = getTime(pathData[i + 1]);
          if (currentTime <= targetTime && nextTime >= targetTime) {
            currentPoint = pathData[i];
            nextPoint = pathData[i + 1];
            break;
          }
        }
        
        // Interpolate between current and next point
        const currentTime = getTime(currentPoint);
        const nextTime = getTime(nextPoint);
        const segmentTime = nextTime - currentTime;
        const t = segmentTime > 0 ? (targetTime - currentTime) / segmentTime : 0;
        
        const newPos = [
          (currentPoint.x || 0) + ((nextPoint.x || 0) - (currentPoint.x || 0)) * t,
          (currentPoint.y || 0) + ((nextPoint.y || 0) - (currentPoint.y || 0)) * t,
          (currentPoint.z || 0) + ((nextPoint.z || 0) - (currentPoint.z || 0)) * t,
        ];
        
        setCurrentPosition(newPos);
        meshRef.current.position.set(newPos[0], newPos[1], newPos[2]);
      } else if (isAnimating && targetPosition) {
        // Fallback: smooth animation towards target position
        const speed = 2; // units per second
        const direction = new THREE.Vector3(
          targetPosition[0] - currentPosition[0],
          targetPosition[1] - currentPosition[1],
          targetPosition[2] - currentPosition[2]
        );
        
        const distance = direction.length();
        if (distance > 0.1) {
          direction.normalize();
          const moveDistance = Math.min(speed * delta, distance);
          const newPos = [
            currentPosition[0] + direction.x * moveDistance,
            currentPosition[1] + direction.y * moveDistance,
            currentPosition[2] + direction.z * moveDistance,
          ];
          setCurrentPosition(newPos);
          meshRef.current.position.set(newPos[0], newPos[1], newPos[2]);
        } else {
          // Reached target, add some hover animation
          const hover = Math.sin(state.clock.elapsedTime * 2) * 0.1;
          meshRef.current.position.y = currentPosition[1] + hover;
        }
      } else {
        // Static position
        meshRef.current.position.set(position[0], position[1], position[2]);
      }
    }
  });

  return (
    <group ref={meshRef} position={currentPosition}>
      <mesh>
        <boxGeometry args={[0.5, 0.2, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {label && (
        <Text
          position={[0, 0.6, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

function DroneVisualization3D({ drones = [], telemetry = {}, showId = null, choreography = null, flightPaths = [], showName = null }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);
  
  // Reset animation when show changes
  useEffect(() => {
    setIsAnimating(false);
    setAnimationTime(0);
  }, [showId, choreography]);

  // Get flight path for each drone
  const getDronePath = (droneId) => {
    if (flightPaths && flightPaths.length > 0) {
      return flightPaths.find((p) => p.droneId === droneId || (p.drone && p.drone.droneId === droneId));
    }
    if (choreography?.flightPaths) {
      return choreography.flightPaths.find((p) => p.droneId === droneId || (p.drone && p.drone.droneId === droneId));
    }
    return null;
  };

  // Get position at current animation time
  const getPositionAtTime = (path, time, duration) => {
    if (!path || !path.pathDataJson || path.pathDataJson.length === 0) {
      return null;
    }
    
    const normalizedTime = (time % duration) / duration;
    const pathData = Array.isArray(path.pathDataJson) ? path.pathDataJson : [];
    
    if (pathData.length === 0) {
      // Fallback to linear interpolation between start and end
      const start = path.startPosition || { x: 0, y: 0, z: 0 };
      const end = path.endPosition || { x: 10, y: 5, z: 10 };
      return [
        start.x + (end.x - start.x) * normalizedTime,
        start.y + (end.y - start.y) * normalizedTime,
        start.z + (end.z - start.z) * normalizedTime,
      ];
    }

    // Find the closest point in path data
    const targetTime = normalizedTime * duration;
    // Поддерживаем как 'time', так и 'timestamp' для обратной совместимости
    const getTime = (point) => point.time !== undefined ? point.time : (point.timestamp !== undefined ? point.timestamp * duration : 0);
    
    let closestPoint = pathData[0];
    for (const point of pathData) {
      const pointTime = getTime(point);
      if (pointTime <= targetTime) {
        closestPoint = point;
      } else {
        break;
      }
    }

    return [closestPoint.x || 0, closestPoint.y || 0, closestPoint.z || 0];
  };

  // Use only the drones passed as props (already filtered by show/choreography)
  // If drones prop is empty or not provided, use empty array to avoid showing all drones
  const relevantDrones = drones && drones.length > 0 
    ? drones 
    : [];

  // Generate animated positions for drones
  const dronesWithAnimation = relevantDrones.map((drone, index) => {
    const tel = telemetry[drone.droneId];
    const path = getDronePath(drone.droneId);
    
    let basePosition = [0, 0, 0];
    if (path && path.startPosition) {
      basePosition = [path.startPosition.x || 0, path.startPosition.y || 0, path.startPosition.z || 0];
    } else if (tel) {
      basePosition = [tel.longitude / 1000 || 0, tel.altitude / 10 || 0, tel.latitude / 1000 || 0];
    } else {
      // Spread drones in a formation pattern if no path/telemetry
      const formationRadius = 5;
      const angle = (index / Math.max(relevantDrones.length, 1)) * Math.PI * 2;
      basePosition = [
        Math.cos(angle) * formationRadius,
        2 + (index % 3) * 2, // Different heights for each drone
        Math.sin(angle) * formationRadius,
      ];
    }

    let targetPosition = basePosition;
    if (isAnimating && path) {
      const duration = choreography?.durationSeconds || 300;
      const currentPos = getPositionAtTime(path, animationTime, duration);
      if (currentPos) {
        targetPosition = currentPos;
      } else if (path.endPosition) {
        targetPosition = [path.endPosition.x || 0, path.endPosition.y || 0, path.endPosition.z || 0];
      }
    } else if (isAnimating && !path) {
      // Fallback formation pattern
      const formationRadius = 5;
      const angle = (index / Math.max(relevantDrones.length, 1)) * Math.PI * 2;
      targetPosition = [
        Math.cos(angle) * formationRadius,
        3 + Math.sin(animationTime + index) * 2,
        Math.sin(angle) * formationRadius,
      ];
    }

    const pathData = path?.pathDataJson || (path?.pathDataJson && Array.isArray(path.pathDataJson) ? path.pathDataJson : null);

    // Generate unique color for each drone based on index if no battery data
    const battery = tel?.batteryLevel || tel?.batteryPercentage;
    const colorIndex = battery !== undefined ? battery : (index % 3) * 40 + 60; // Use index-based color if no battery

    return {
      ...drone,
      position: basePosition,
      targetPosition,
      battery: battery !== undefined ? battery : 100,
      colorIndex, // Store color index for unique colors
      path,
      pathData,
    };
  });

  useEffect(() => {
    let animationFrame;
    if (isAnimating) {
      const animate = () => {
        setAnimationTime((prev) => prev + 0.016); // ~60fps
        animationFrame = requestAnimationFrame(animate);
      };
      animate();
    }
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isAnimating]);

  const handlePlay = () => {
    setIsAnimating(true);
  };

  const handlePause = () => {
    setIsAnimating(false);
  };

  const handleStop = () => {
    setIsAnimating(false);
    setAnimationTime(0);
  };

  const duration = choreography?.durationSeconds || 300;

  return (
    <Paper sx={{ 
      p: 3,
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      borderRadius: '16px',
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            3D Drone Visualization
          </Typography>
          {showName && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Show: {showName}
            </Typography>
          )}
          {choreography && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Choreography: {choreography.choreographyName}
            </Typography>
          )}
        </Box>
        <Box>
          {!isAnimating ? (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handlePlay}
              size="small"
            >
              Start Show
            </Button>
          ) : (
            <>
              <IconButton onClick={handlePause} color="primary">
                <Pause />
              </IconButton>
              <IconButton onClick={handleStop} color="error">
                <Stop />
              </IconButton>
            </>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          height: 500,
          width: '100%',
          backgroundColor: '#1e293b',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <Canvas camera={{ position: [15, 10, 15], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[0, 10, 0]} intensity={0.5} />
          <gridHelper args={[20, 20]} />
          {dronesWithAnimation.map((drone, index) => {
            // Generate unique color for each drone
            let color = '#2563eb'; // Default blue
            if (drone.battery !== undefined && drone.battery !== null) {
              // Use battery-based color if available
              color = drone.battery > 50
                ? '#2563eb'
                : drone.battery > 20
                ? '#f59e0b'
                : '#dc2626';
            } else {
              // Use index-based color for unique visualization
              const colors = [
                '#2563eb', // Blue
                '#10b981', // Green
                '#f59e0b', // Orange
                '#8b5cf6', // Purple
                '#ec4899', // Pink
                '#06b6d4', // Cyan
                '#f97316', // Orange-red
                '#84cc16', // Lime
              ];
              color = colors[index % colors.length];
            }

            // Логируем для отладки (только для первого дрона)
            if (index === 0 && isAnimating) {
              console.log('🎬 [DroneVisualization3D] Анимация дрона:', {
                droneId: drone.droneId,
                hasPathData: !!drone.pathData,
                pathDataLength: drone.pathData?.length || 0,
                pathDataSample: drone.pathData?.slice(0, 2),
                animationTime,
                duration,
              });
            }

            return (
              <Drone
                key={drone.droneId}
                position={drone.position}
                targetPosition={drone.targetPosition}
                color={color}
                label={drone.serialNumber}
                isAnimating={isAnimating}
                pathData={drone.pathData}
                animationTime={animationTime}
                duration={duration}
              />
            );
          })}
          <OrbitControls enableDamping dampingFactor={0.05} />
        </Canvas>
      </Box>
      {isAnimating && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
          Show in progress... {Math.floor(animationTime)}s / {duration}s
        </Typography>
      )}
    </Paper>
  );
}

export default DroneVisualization3D;
