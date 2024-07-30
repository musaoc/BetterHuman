// src/components/TodoList.js

import React, { useState } from 'react';
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const initialTasks = [
  { id: uuidv4(), text: 'Sample Task 1', priority: 'normal', subtasks: [] },
  { id: uuidv4(), text: 'Sample Task 2', priority: 'normal', subtasks: [] },
];

function TodoList() {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [priority, setPriority] = useState('normal');
  const [subtask, setSubtask] = useState('');

  const handleAddTask = () => {
    setTasks([...tasks, { id: uuidv4(), text: newTask, priority: 'normal', subtasks: [] }]);
    setNewTask('');
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
  };

  const handleSaveTask = () => {
    setTasks(tasks.map((task) => (task.id === editingTask.id ? { ...task, text: editingTask.text, priority: priority } : task)));
    setEditingTask(null);
    setPriority('normal');
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleAddSubtask = () => {
    setTasks(tasks.map((task) => (task.id === editingTask.id ? { ...task, subtasks: [...task.subtasks, subtask] } : task)));
    setSubtask('');
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setTasks(items);
  };

  return (
    <div>
      <TextField label="New Task" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
      <Button onClick={handleAddTask}>Add Task</Button>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tasks">
          {(provided) => (
            <List {...provided.droppableProps} ref={provided.innerRef}>
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided) => (
                    <ListItem
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{ backgroundColor: task.priority === 'high' ? 'red' : 'white' }}
                    >
                      <ListItemText primary={task.text} />
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
    </div>
  );
}

export default TodoList;
