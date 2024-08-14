import React, { useState, useEffect, useCallback } from 'react';
import { 
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, 
  Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, 
  Checkbox, Chip, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import GetAppIcon from '@mui/icons-material/GetApp';
import { v4 as uuidv4 } from 'uuid';

const initialTasks = [
  { id: uuidv4(), text: 'Sample Task 1', completed: false, priority: 'normal', subtasks: [], status: 'To Do', dueDate: null, tags: [] },
  { id: uuidv4(), text: 'Sample Task 2', completed: false, priority: 'normal', subtasks: [], status: 'To Do', dueDate: null, tags: [] },
];

function TodoList() {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [priority, setPriority] = useState('normal');
  const [subtask, setSubtask] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newTag, setNewTag] = useState('');

  const loadTasks = useCallback(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Error parsing saved tasks:', error);
        setTasks(initialTasks);
      }
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const saveTasks = useCallback((updatedTasks) => {
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  }, []);

  const updateTasks = useCallback((newTasks) => {
    setTasks(newTasks);
    saveTasks(newTasks);
  }, [saveTasks]);

  const handleAddTask = () => {
    if (newTask.trim()) {
      const newTasks = [...tasks, { 
        id: uuidv4(), 
        text: newTask,
        completed: false,
        priority, 
        subtasks: [], 
        status: 'To Do',
        dueDate: null,
        tags: []
      }];
      updateTasks(newTasks);
      setNewTask('');
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setPriority(task.priority);
  };

  const handleSaveTask = () => {
    const updatedTasks = tasks.map((task) =>
      task.id === editingTask.id
        ? { ...editingTask, priority }
        : task
    );
    updateTasks(updatedTasks);
    setEditingTask(null);
  };

  const handleDeleteTask = (id) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    updateTasks(updatedTasks);
  };

  const handleAddSubtask = () => {
    if (subtask.trim() && editingTask) {
      setEditingTask({
        ...editingTask,
        subtasks: [...editingTask.subtasks, { id: uuidv4(), text: subtask, completed: false }]
      });
      setSubtask('');
    }
  };

  const handleToggleSubtask = (taskId, subtaskId) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            subtasks: task.subtasks.map((st) =>
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            )
          }
        : task
    );
    updateTasks(updatedTasks);
  };

  const handleToggleTask = (taskId) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    updateTasks(updatedTasks);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reorderedTasks = Array.from(tasks);
    const [movedTask] = reorderedTasks.splice(result.source.index, 1);
    reorderedTasks.splice(result.destination.index, 0, movedTask);
    updateTasks(reorderedTasks);
  };

  const handleStatusChange = (taskId, newStatus) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status: newStatus } : task
    );
    updateTasks(updatedTasks);
  };

  const handleClearTasks = () => {
    updateTasks([]);
    setDialogOpen(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && editingTask) {
      setEditingTask({
        ...editingTask,
        tags: [...editingTask.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditingTask({
      ...editingTask,
      tags: editingTask.tags.filter((tag) => tag !== tagToRemove)
    });
  };

  const filteredTasks = tasks
    .filter((task) => {
      if (filterStatus === 'all') return true;
      return task.status === filterStatus;
    })
    .filter((task) =>
      task.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const exportToCSV = () => {
    const headers = ['ID', 'Text', 'Completed', 'Priority', 'Status', 'Due Date', 'Tags', 'Subtasks'];
    const csvContent = [
      headers.join(','),
      ...tasks.map(task => [
        task.id,
        `"${task.text.replace(/"/g, '""')}"`,
        task.completed,
        task.priority,
        task.status,
        task.dueDate || '',
        `"${task.tags.join(', ')}"`,
        `"${task.subtasks.map(st => `${st.text} (${st.completed ? 'Done' : 'Pending'})`).join(', ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'tasks.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div>
      <TextField
        label="New Task"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        variant="outlined"
        fullWidth
        margin="normal"
      />
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={handleAddTask}
      >
        Add Task
      </Button>

      <TextField
        label="Search tasks"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        variant="outlined"
        fullWidth
        margin="normal"
      />

      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel>Filter by Status</InputLabel>
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          label="Filter by Status"
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="To Do">To Do</MenuItem>
          <MenuItem value="In Progress">In Progress</MenuItem>
          <MenuItem value="Done">Done</MenuItem>
        </Select>
      </FormControl>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tasks">
          {(provided) => (
            <List ref={provided.innerRef} {...provided.droppableProps}>
              {filteredTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided) => (
                    <ListItem
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <Checkbox
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                        color="primary"
                      />
                      <ListItemText
                        primary={task.text}
                        secondary={
                          <React.Fragment>
                            {task.tags.map((tag) => (
                              <Chip key={tag} label={tag} size="small" style={{ marginRight: 4 }} />
                            ))}
                            <br />
                            {task.subtasks.map((subtask) => (
                              <Checkbox
                                key={subtask.id}
                                checked={subtask.completed}
                                onChange={() => handleToggleSubtask(task.id, subtask.id)}
                                size="small"
                              />
                            ))}
                          </React.Fragment>
                        }
                        style={{ textDecoration: task.completed ? 'line-through' : 'none' }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleEditTask(task)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleDeleteTask(task.id)}>
                          <DeleteIcon />
                        </IconButton>
                        <Select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          style={{ marginLeft: 8 }}
                        >
                          <MenuItem value="To Do">To Do</MenuItem>
                          <MenuItem value="In Progress">In Progress</MenuItem>
                          <MenuItem value="Done">Done</MenuItem>
                        </Select>
                      </ListItemSecondaryAction>
                    </ListItem>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={!!editingTask} onClose={() => setEditingTask(null)}>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <TextField
            label="Task Text"
            value={editingTask ? editingTask.text : ''}
            onChange={(e) => setEditingTask({ ...editingTask, text: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Subtask"
            value={subtask}
            onChange={(e) => setSubtask(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button onClick={handleAddSubtask} variant="outlined">Add Subtask</Button>
          {editingTask && editingTask.subtasks.map((st) => (
            <div key={st.id}>
              <Checkbox
                checked={st.completed}
                onChange={() => handleToggleSubtask(editingTask.id, st.id)}
              />
              <span style={{ textDecoration: st.completed ? 'line-through' : 'none' }}>{st.text}</span>
            </div>
          ))}
          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Due Date"
            type="date"
            value={editingTask ? editingTask.dueDate || '' : ''}
            onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
            fullWidth
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            label="New Tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button onClick={handleAddTag} variant="outlined">Add Tag</Button>
          <div>
            {editingTask && editingTask.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                style={{ margin: 4 }}
              />
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingTask(null)} color="primary">Cancel</Button>
          <Button onClick={handleSaveTask} color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Clear All Tasks</DialogTitle>
        <DialogContent>
          Are you sure you want to remove all tasks from the list?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="primary">Cancel</Button>
          <Button onClick={handleClearTasks} color="primary">Clear</Button>
        </DialogActions>
      </Dialog>

      <Button onClick={() => setDialogOpen(true)} color="secondary" variant="contained" style={{ marginTop: 16, marginRight: 8 }}>
        Clear All Tasks
      </Button>
      <Button onClick={exportToCSV} color="primary" variant="contained" style={{ marginTop: 16 }} startIcon={<GetAppIcon />}>
        Export to CSV
      </Button>
    </div>
  );
}

export default TodoList;