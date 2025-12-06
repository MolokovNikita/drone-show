import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  CheckCircle as ConfirmIcon,
  Close as CloseIcon,
  AutoAwesome as SparklesIcon,
} from '@mui/icons-material';

function AIChat({ messages = [], onSendMessage, isLoading = false, onClose, onConfirmShow, lastShowData }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Находим последнее сообщение с systemData (это сообщение с данными для создания шоу)
  const lastAIMessage = messages
    .filter(m => m.role === 'assistant' && m.systemData)
    .slice(-1)[0]; // Берем последнее сообщение с systemData

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        borderRadius: 0,
        overflow: 'hidden',
        bgcolor: '#ffffff',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar sx={{ 
          bgcolor: 'primary.main', 
          width: 40, 
          height: 40,
        }}>
          <SparklesIcon sx={{ fontSize: 20 }} />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.25, color: 'text.primary' }}>
            AI Генератор Шоу
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            Создавайте световые шоу дронов
          </Typography>
        </Box>
        {onClose && (
          <IconButton 
            size="small" 
            onClick={onClose} 
            sx={{ 
              color: 'text.secondary',
              '&:hover': { 
                bgcolor: 'action.hover',
                color: 'text.primary'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          bgcolor: '#fafbfc',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#e2e8f0',
            borderRadius: '2px',
            '&:hover': {
              background: '#cbd5e1',
            },
          },
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
              px: 3,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <SparklesIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1.5, 
                fontWeight: 600,
                color: 'text.primary',
              }}
            >
              Добро пожаловать
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                textAlign: 'center', 
                maxWidth: 400,
                lineHeight: 1.6,
                color: 'text.secondary',
              }}
            >
              Опишите шоу, которое вы хотите создать, и я сгенерирую полную концепцию с идеями хореографии.
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                gap: 1,
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
              }}
            >
              {message.role === 'assistant' && (
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main', 
                    width: 32, 
                    height: 32,
                    flexShrink: 0,
                  }}
                >
                  <SparklesIcon sx={{ fontSize: 18 }} />
                </Avatar>
              )}
              <Box
                sx={{
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.25,
                }}
              >
                {/* Сообщения пользователя */}
                {message.role === 'user' && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: '12px 12px 4px 12px',
                      bgcolor: 'primary.main',
                      color: 'white',
                      wordBreak: 'break-word',
                      maxWidth: '100%',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        whiteSpace: 'pre-wrap', 
                        lineHeight: 1.5,
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        color: 'white',
                        m: 0,
                      }}
                    >
                      {typeof message.content === 'string' 
                        ? message.content 
                        : (message.content?.showName || message.content?.concept || JSON.stringify(message.content, null, 2))}
                    </Typography>
                  </Paper>
                )}

                {/* Сообщения ассистента - объект с данными шоу */}
                {message.role === 'assistant' && message.content && typeof message.content === 'object' ? (
                  <Card
                    elevation={0}
                    sx={{
                      bgcolor: 'background.paper',
                      borderRadius: '12px 12px 12px 4px',
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600, 
                          mb: 1.5,
                          color: 'text.primary',
                          fontSize: '1rem',
                        }}
                      >
                        {message.content.showName || 'Generated Show'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, flexWrap: 'wrap' }}>
                        {message.content.venue && (
                          <Chip
                            label={message.content.venue}
                            size="small"
                            sx={{ 
                              bgcolor: 'action.hover',
                              color: 'text.primary',
                              fontWeight: 500,
                              height: 24,
                              fontSize: '0.75rem',
                            }}
                          />
                        )}
                        {message.content.durationSeconds && (
                          <Chip
                            label={`${message.content.durationSeconds}s`}
                            size="small"
                            sx={{ 
                              bgcolor: 'action.hover',
                              color: 'text.primary',
                              fontWeight: 500,
                              height: 24,
                              fontSize: '0.75rem',
                            }}
                          />
                        )}
                      </Box>
                      
                      {/* Показываем concept для пользователя, если есть */}
                      {message.content.concept && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 2,
                            color: 'text.secondary',
                            lineHeight: 1.5,
                            fontSize: '0.875rem',
                          }}
                        >
                          {message.content.concept}
                        </Typography>
                      )}
                      
                      {/* Fallback на notes, если нет concept */}
                      {!message.content.concept && message.content.notes && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 2,
                            color: 'text.secondary',
                            lineHeight: 1.5,
                            fontSize: '0.875rem',
                          }}
                        >
                          {message.content.notes}
                        </Typography>
                      )}
                      
                      {message.content.choreographyIdeas && message.content.choreographyIdeas.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 600, 
                              mb: 1.5,
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            Идеи хореографии
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {message.content.choreographyIdeas.map((idea, idx) => (
                              <Box 
                                key={idx} 
                                sx={{ 
                                  p: 1.5,
                                  borderRadius: 1,
                                  bgcolor: 'action.hover',
                                  borderLeft: '2px solid',
                                  borderColor: 'primary.main',
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 0.75 }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 600,
                                      fontSize: '0.875rem',
                                      color: 'text.primary',
                                    }}
                                  >
                                    {idea.name}
                                  </Typography>
                                  {idea.droneCount && (
                                    <Chip
                                      label={`${idea.droneCount}`}
                                      size="small"
                                      sx={{ 
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        fontWeight: 500,
                                        height: 20,
                                        fontSize: '0.7rem',
                                      }}
                                    />
                                  )}
                                </Box>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: 'text.secondary',
                                    fontSize: '0.8125rem',
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {idea.description}
                                </Typography>
                                {idea.durationSeconds && (
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: 'text.secondary',
                                      mt: 0.5,
                                      display: 'block',
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    {idea.durationSeconds}s
                                  </Typography>
                                )}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ) : message.role === 'assistant' && (
                  /* Сообщения ассистента - обычный текст */
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: '12px 12px 12px 4px',
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      wordBreak: 'break-word',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        whiteSpace: 'pre-wrap', 
                        lineHeight: 1.5,
                        fontSize: '0.875rem',
                        m: 0,
                        color: 'text.primary',
                      }}
                    >
                      {typeof message.content === 'string' 
                        ? message.content 
                        : JSON.stringify(message.content, null, 2)}
                    </Typography>
                  </Paper>
                )}
                
                {/* Время сообщения */}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.disabled', 
                    px: 1,
                    fontSize: '0.6875rem',
                    alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                    mt: 0.25,
                  }}
                >
                  {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
              {message.role === 'user' && (
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main', 
                    width: 32, 
                    height: 32,
                    flexShrink: 0,
                  }}
                >
                  <PersonIcon sx={{ fontSize: 18 }} />
                </Avatar>
              )}
            </Box>
          ))
        )}
        {isLoading && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main', 
                width: 32, 
                height: 32,
                flexShrink: 0,
              }}
            >
              <SparklesIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: '12px 12px 12px 4px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CircularProgress size={16} thickness={4} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.8125rem' }}>
                Генерация шоу...
              </Typography>
            </Paper>
          </Box>
        )}
        
        {/* Кнопка подтверждения для последнего ответа ИИ */}
        {lastAIMessage && onConfirmShow && !isLoading && (
          <Box 
            sx={{ 
              mt: 1.5,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              size="medium"
              startIcon={<ConfirmIcon />}
              onClick={() => {
                // Передаем systemData для создания шоу, а не userView
                if (lastAIMessage.systemData) {
                  onConfirmShow(lastAIMessage.systemData);
                } else {
                  console.error('No systemData in last AI message');
                }
              }}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Создать шоу
            </Button>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Input */}
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Опишите шоу, которое хотите создать..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.875rem',
                '& .MuiInputBase-input': {
                  py: 1.25,
                },
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            sx={{ 
              alignSelf: 'flex-end',
              width: 40,
              height: 40,
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}

export default AIChat;
