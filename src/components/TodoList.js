import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveTasks, getTasks, saveJournalEntry, getJournalEntries, incrementStat, addXP } from '../services/userService';
import './TodoList.css';

const CATEGORIES = ['All', 'Work', 'Personal', 'Shopping', 'Health', 'Other'];
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['To Do', 'In Progress', 'Done'];

const JOURNAL_PROMPTS = [
  "What are you grateful for today?",
  "What's one thing you learned today?",
  "How are you feeling right now?",
  "What's your biggest win today?",
  "What would make today great?",
  "What's challenging you right now?",
  "What are you looking forward to?",
  "How can you improve tomorrow?"
];

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
  const { currentUser } = useAuth();
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
  
  // Journal states
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'journal'
  const [journalEntry, setJournalEntry] = useState('');
  const [journalMood, setJournalMood] = useState('neutral');
  const [journalEntries, setJournalEntries] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState(JOURNAL_PROMPTS[0]);
  const [savingJournal, setSavingJournal] = useState(false);

  // Load tasks from localStorage or Firestore
  useEffect(() => {
    const loadTasks = async () => {
      if (currentUser) {
        // Load from Firestore
        const result = await getTasks(currentUser.uid);
        if (result.success && result.tasks.length > 0) {
          setTasks(result.tasks);
        }
        // Load journal entries
        const journalResult = await getJournalEntries(currentUser.uid);
        if (journalResult.success) {
          setJournalEntries(journalResult.entries);
        }
      } else {
        // Load from localStorage for non-authenticated users
        const savedTasks = localStorage.getItem('betterHumanTasks');
        if (savedTasks) {
          try {
            const parsedTasks = JSON.parse(savedTasks);
            setTasks(parsedTasks);
          } catch (error) {
            console.error('Error loading tasks:', error);
          }
        }
      }
    };
    loadTasks();
    // Set random prompt
    setCurrentPrompt(JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]);
  }, [currentUser]);

  // Save tasks to localStorage or Firestore
  useEffect(() => {
    const saveTasksData = async () => {
      if (currentUser) {
        await saveTasks(currentUser.uid, tasks);
      } else {
        localStorage.setItem('betterHumanTasks', JSON.stringify(tasks));
      }
    };
    saveTasksData();
  }, [tasks, currentUser]);

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

  const handleToggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const newCompleted = !task.completed;
    
    setTasks(tasks.map(task =>
      task.id === taskId 
        ? { ...task, completed: newCompleted, status: newCompleted ? 'Done' : 'To Do' }
        : task
    ));
    
    // Track completion in Firestore
    if (currentUser && newCompleted) {
      await incrementStat(currentUser.uid, 'tasksCompleted', 1);
      await addXP(currentUser.uid, 5); // 5 XP per task completed
    }
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

  // Journal functions
  const handleSaveJournal = async () => {
    if (!journalEntry.trim()) return;
    
    setSavingJournal(true);
    
    const entry = {
      content: journalEntry.trim(),
      mood: journalMood,
      prompt: currentPrompt,
      date: new Date().toISOString()
    };
    
    if (currentUser) {
      await saveJournalEntry(currentUser.uid, entry);
      const result = await getJournalEntries(currentUser.uid);
      if (result.success) {
        setJournalEntries(result.entries);
      }
    } else {
      // Save to localStorage for non-authenticated users
      const savedEntries = JSON.parse(localStorage.getItem('betterHumanJournal') || '[]');
      savedEntries.unshift({ id: Date.now(), ...entry });
      localStorage.setItem('betterHumanJournal', JSON.stringify(savedEntries));
      setJournalEntries(savedEntries);
    }
    
    setJournalEntry('');
    setJournalMood('neutral');
    setCurrentPrompt(JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)]);
    setSavingJournal(false);
  };

  const getMoodEmoji = (mood) => {
    const moods = {
      great: '😄',
      good: '🙂',
      neutral: '😐',
      bad: '😔',
      terrible: '😢'
    };
    return moods[mood] || '😐';
  };

  const formatJournalDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="todo-app-container">
      <div className="todo-header">
        <h1>📝 Task Master</h1>
        <p>Organize your life, one task at a time</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <span>📋</span> Tasks
        </button>
        <button 
          className={`tab-button ${activeTab === 'journal' ? 'active' : ''}`}
          onClick={() => setActiveTab('journal')}
        >
          <span>📓</span> Daily Journal
        </button>
      </div>

      {activeTab === 'tasks' ? (
        <>
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
        </>
      ) : (
        /* Journal Tab */
        <div className="journal-container">
          {/* Journal Entry Form */}
          <div className="journal-form">
            <div className="journal-prompt">
              <span className="prompt-icon">💭</span>
              <p>{currentPrompt}</p>
              <button 
                className="refresh-prompt"
                onClick={() => setCurrentPrompt(JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)])}
              >
                🔄
              </button>
            </div>
            
            <div className="mood-selector">
              <span className="mood-label">How are you feeling?</span>
              <div className="mood-options">
                {['terrible', 'bad', 'neutral', 'good', 'great'].map(mood => (
                  <button
                    key={mood}
                    className={`mood-button ${journalMood === mood ? 'selected' : ''}`}
                    onClick={() => setJournalMood(mood)}
                    title={mood}
                  >
                    {getMoodEmoji(mood)}
                  </button>
                ))}
              </div>
            </div>
            
            <textarea
              className="journal-textarea"
              placeholder="Write your thoughts here..."
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              rows={6}
            />
            
            <button 
              className="btn-primary journal-save"
              onClick={handleSaveJournal}
              disabled={!journalEntry.trim() || savingJournal}
            >
              {savingJournal ? 'Saving...' : '💾 Save Entry'}
            </button>
          </div>
          
          {/* Journal Entries List */}
          <div className="journal-entries">
            <h3>📚 Past Entries</h3>
            {journalEntries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No journal entries yet</h3>
                <p>Start writing to track your thoughts and feelings</p>
              </div>
            ) : (
              <div className="entries-list">
                {journalEntries.map((entry, index) => (
                  <div key={entry.id || index} className="journal-entry-card">
                    <div className="entry-header">
                      <span className="entry-mood">{getMoodEmoji(entry.mood)}</span>
                      <span className="entry-date">
                        {formatJournalDate(entry.date || entry.createdAt?.toDate?.() || new Date())}
                      </span>
                    </div>
                    {entry.prompt && (
                      <p className="entry-prompt">"{entry.prompt}"</p>
                    )}
                    <p className="entry-content">{entry.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TodoList;