import React, { useState, useEffect, useCallback } from 'react';
import './TodoList.css';

const CATEGORIES = ['All', 'Work', 'Personal', 'Shopping', 'Health', 'Other'];
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['To Do', 'In Progress', 'Done'];

const initialTasks = [
  { 
    id: Date.now(), 
    text: 'Welcome to your enhanced Todo List!', 
    completed: false, 
    priority: 'medium', 
    category: 'Personal',
    subtasks: [], 
    status: 'To Do', 
    dueDate: null, 
    tags: ['welcome'],
    createdAt: new Date().toISOString()
  }
];

function TodoList() {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('betterHumanTasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem('betterHumanTasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      const newTaskObj = {
        id: Date.now(),
        text: newTask.trim(),
        completed: false,
        priority,
        category,
        subtasks: [],
        status: 'To Do',
        dueDate: dueDate || null,
        tags: [],
        createdAt: new Date().toISOString()
      };
      setTasks([newTaskObj, ...tasks]);
      setNewTask('');
      setDueDate('');
      setPriority('medium');
    }
  };

  const handleToggleTask = (taskId) => {
    setTasks(tasks.map(task =>
      task.id === taskId 
        ? { ...task, completed: !task.completed, status: !task.completed ? 'Done' : 'To Do' }
        : task
    ));
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setNewTask(task.text);
    setPriority(task.priority);
    setCategory(task.category);
    setDueDate(task.dueDate || '');
  };

  const handleSaveEdit = () => {
    if (newTask.trim()) {
      setTasks(tasks.map(task =>
        task.id === editingTask.id
          ? { ...task, text: newTask.trim(), priority, category, dueDate: dueDate || null }
          : task
      ));
      setEditingTask(null);
      setNewTask('');
      setDueDate('');
      setPriority('medium');
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setNewTask('');
    setDueDate('');
    setPriority('medium');
  };

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(tasks.map(task =>
      task.id === taskId 
        ? { ...task, status: newStatus, completed: newStatus === 'Done' }
        : task
    ));
  };

  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetTask) => {
    if (!draggedTask || draggedTask.id === targetTask.id) return;

    const draggedIndex = tasks.findIndex(t => t.id === draggedTask.id);
    const targetIndex = tasks.findIndex(t => t.id === targetTask.id);

    const newTasks = [...tasks];
    newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedTask);

    setTasks(newTasks);
    setDraggedTask(null);
  };

  const filteredTasks = tasks
    .filter(task => filterCategory === 'All' || task.category === filterCategory)
    .filter(task => filterStatus === 'all' || task.status === filterStatus)
    .filter(task => showCompleted || !task.completed)
    .filter(task =>
      task.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    highPriority: tasks.filter(t => t.priority === 'high' && !t.completed).length
  };

  const completionPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `tasks_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="todo-app-container">
      <div className="todo-header">
        <h1>📝 Task Master</h1>
        <p>Organize your life, one task at a time</p>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.highPriority}</div>
            <div className="stat-label">High Priority</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-header">
          <span>Overall Progress</span>
          <span className="progress-percentage">{completionPercentage.toFixed(0)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Add/Edit Task Form */}
      <form className="todo-form" onSubmit={editingTask ? (e) => { e.preventDefault(); handleSaveEdit(); } : handleAddTask}>
        <div className="form-header">
          <h3>{editingTask ? '✏️ Edit Task' : '➕ Add New Task'}</h3>
          {editingTask && (
            <button type="button" className="btn-cancel" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
        </div>
        
        <div className="form-group">
          <input
            type="text"
            className="todo-input"
            placeholder="What needs to be done?"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Priority</label>
            <select 
              className="form-select" 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select 
              className="form-select" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary">
          {editingTask ? '💾 Save Changes' : '➕ Add Task'}
        </button>
      </form>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <div className="category-filters">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="status-filters">
            <button
              className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All
            </button>
            {STATUSES.map(status => (
              <button
                key={status}
                className={`filter-chip ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="toggle-completed">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
            />
            <span>Show Completed</span>
          </label>
        </div>
      </div>

      {/* Tasks List */}
      <div className="tasks-container">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No tasks found</h3>
            <p>
              {searchTerm 
                ? "Try adjusting your search or filters" 
                : "Add a new task to get started!"}
            </p>
          </div>
        ) : (
          <div className="tasks-list">
            {filteredTasks.map(task => (
              <div
                key={task.id}
                className={`task-item priority-${task.priority} ${task.completed ? 'completed' : ''} ${draggedTask?.id === task.id ? 'dragging' : ''}`}
                draggable
                onDragStart={() => handleDragStart(task)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(task)}
              >
                <div className="task-main">
                  <label className="task-checkbox">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                    />
                    <span className="checkbox-custom"></span>
                  </label>

                  <div className="task-content">
                    <div className="task-text">{task.text}</div>
                    
                    <div className="task-meta">
                      <span className={`task-priority priority-${task.priority}`}>
                        {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
                        {task.priority}
                      </span>
                      
                      <span className="task-category">{task.category}</span>
                      
                      {task.dueDate && (
                        <span className={`task-due-date ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
                          📅 {new Date(task.dueDate).toLocaleDateString()}
                          {isOverdue(task.dueDate) && ' (Overdue!)'}
                        </span>
                      )}

                      <select
                        className="task-status-select"
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="task-actions">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => handleEditTask(task)}
                    title="Edit task"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDeleteTask(task.id)}
                    title="Delete task"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn-secondary" onClick={exportToJSON}>
          📥 Export Tasks
        </button>
        <button 
          className="btn-danger" 
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all tasks?')) {
              setTasks([]);
            }
          }}
        >
          🗑️ Clear All
        </button>
      </div>
    </div>
  );
}

export default TodoList;