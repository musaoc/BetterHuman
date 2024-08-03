import React, { useState, useEffect } from 'react';
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Tabs, Tab } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { v4 as uuidv4 } from 'uuid';



const initialTasks = [
  { id: uuidv4(), text: 'Sample Task 1', priority: 'normal', subtasks: [], status: 'To Do' },
  { id: uuidv4(), text: 'Sample Task 2', priority: 'normal', subtasks: [], status: 'To Do' },
];

function TodoList() {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [priority, setPriority] = useState('normal');
  const [subtask, setSubtask] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    setTasks(savedTasks);
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: uuidv4(), text: newTask, priority, subtasks: [], status: 'To Do' }]);
      setNewTask('');
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setPriority(task.priority);
  };

  const handleSaveTask = () => {
    setTasks(tasks.map((task) =>
      task.id === editingTask.id
        ? { ...task, text: editingTask.text, priority }
        : task
    ));
    setEditingTask(null);
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleAddSubtask = () => {
    if (subtask.trim() && editingTask) {
      setTasks(tasks.map((task) =>
        task.id === editingTask.id
          ? { ...task, subtasks: [...task.subtasks, subtask] }
          : task
      ));
      setSubtask('');
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reorderedTasks = Array.from(tasks);
    const [movedTask] = reorderedTasks.splice(result.source.index, 1);
    reorderedTasks.splice(result.destination.index, 0, movedTask);
    setTasks(reorderedTasks);
  };

  const handleTabChange = (event, newIndex) => {
    setSlideIndex(newIndex);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleClearTasks = () => {
    setTasks([]);
    handleDialogClose();
  };

  return (
    <div>
      <TextField
        label="New Task"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
      />
      <Button onClick={handleAddTask}>Add Task</Button>

      <Tabs value={slideIndex} onChange={handleTabChange}>
        <Tab label={`To Do (${tasks.filter(t => t.status === 'To Do').length})`} />
        <Tab label={`Done (${tasks.filter(t => t.status === 'Done').length})`} />
        <Tab label={`All (${tasks.length})`} />
      </Tabs>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tasks">
          {(provided) => (
            <List ref={provided.innerRef} {...provided.droppableProps}>
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided) => (
                    <ListItem
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{ ...provided.draggableProps.style, backgroundColor: task.priority === 'high' ? 'red' : 'white' }}
                    >
                      <ListItemText primary={task.text} secondary={task.subtasks.join(', ')} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleEditTask(task)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleDeleteTask(task.id)}>
                          <DeleteIcon />
                        </IconButton>
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
          />
          <TextField
            label="Subtask"
            value={subtask}
            onChange={(e) => setSubtask(e.target.value)}
            fullWidth
          />
          <Button onClick={handleAddSubtask}>Add Subtask</Button>
          <TextField
            select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            fullWidth
            SelectProps={{
              native: true,
            }}
            variant="outlined"
          >
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingTask(null)} color="primary">Cancel</Button>
          <Button onClick={handleSaveTask} color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Clear All Tasks</DialogTitle>
        <DialogContent>
          Are you sure you want to remove all tasks from the list?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">Cancel</Button>
          <Button onClick={handleClearTasks} color="primary">Clear</Button>
        </DialogActions>
      </Dialog>

      <IconButton onClick={() => setRemoveMode(!removeMode)}>
        {removeMode ? <CloseIcon /> : <EditIcon />}
      </IconButton>
    </div>
  );
}

export default TodoList;
