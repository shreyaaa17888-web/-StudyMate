/**
 * StudyMate - Smart Student Companion
 * Core Application Logic (Vanilla JavaScript)
 * 
 * Features:
 * 1. View Navigation & Responsive Sidebar
 * 2. Real-time Greetings & Date Display
 * 3. LocalStorage Data Persistence with Initial Demo Data
 * 4. Assignments Management (Add, Toggle, Delete, Filter, Search)
 * 5. Daily Study Task Checklist & Real-time Progress Tracking
 * 6. Interactive Class Timetable with Day-of-Week Filters
 * 7. Academic Progress Analytics & Stats
 * 8. Reusable Modal Dialog System & Toast Feedback
 */

// ==========================================
// 1. Initial Demo Data & State Store
// ==========================================

const DEFAULT_DATA = {
  assignments: [
    {
      id: 'assign-1',
      title: 'Machine Learning Project Proposal',
      subject: 'CS 401',
      priority: 'High',
      dueDate: getFutureDate(2, '23:59'),
      notes: 'Formulate thesis on Convolutional Neural Networks and cite at least 3 IEEE papers.',
      completed: false
    },
    {
      id: 'assign-2',
      title: 'Linear Algebra Problem Set 5',
      subject: 'MATH 220',
      priority: 'Medium',
      dueDate: getFutureDate(4, '17:00'),
      notes: 'Eigenvalues, Eigenvectors, and Matrix Diagonalization problems 1-15.',
      completed: false
    },
    {
      id: 'assign-3',
      title: 'Database Normalization Essay',
      subject: 'CS 305',
      priority: 'Low',
      dueDate: getFutureDate(7, '20:00'),
      notes: 'Explain 1NF through BCNF with student enrollment schema examples.',
      completed: true
    }
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Review Lecture 12 slides on Graph Algorithms',
      category: 'Revision',
      duration: '35 mins',
      completed: true
    },
    {
      id: 'task-2',
      title: 'Solve 3 Dynamic Programming practice problems',
      category: 'Practice',
      duration: '45 mins',
      completed: false
    },
    {
      id: 'task-3',
      title: 'Read Physics Chapter 8: Electromagnetic Waves',
      category: 'Reading',
      duration: '30 mins',
      completed: false
    }
  ],
  timetable: [
    {
      id: 'class-1',
      day: 'Monday',
      subject: 'Data Structures & Algorithms',
      startTime: '09:00',
      endTime: '10:30',
      room: 'Hall B - Room 204',
      instructor: 'Dr. Sarah Mitchell'
    },
    {
      id: 'class-2',
      day: 'Monday',
      subject: 'Applied Linear Algebra',
      startTime: '11:00',
      endTime: '12:30',
      room: 'Science Complex 102',
      instructor: 'Prof. David Vance'
    },
    {
      id: 'class-3',
      day: 'Tuesday',
      subject: 'Database Management Systems',
      startTime: '10:00',
      endTime: '11:30',
      room: 'Lab 3, CS Department',
      instructor: 'Dr. Elena Rostova'
    },
    {
      id: 'class-4',
      day: 'Wednesday',
      subject: 'Artificial Intelligence & Robotics',
      startTime: '14:00',
      endTime: '16:00',
      room: 'Auditorium 1',
      instructor: 'Dr. Alan Turing'
    },
    {
      id: 'class-5',
      day: 'Thursday',
      subject: 'Computer Networks & Security',
      startTime: '09:30',
      endTime: '11:00',
      room: 'Tech Hub 401',
      instructor: 'Prof. Marcus Chen'
    },
    {
      id: 'class-6',
      day: 'Friday',
      subject: 'Software Engineering Workshop',
      startTime: '13:00',
      endTime: '15:30',
      room: 'Innovation Center',
      instructor: 'Prof. Rachel Green'
    }
  ]
};

// Global Application State
let appData = {
  assignments: [],
  tasks: [],
  timetable: []
};

// Current active filter states
let currentAssignmentFilter = 'all';
let currentAssignmentSearch = '';
let currentTimetableDay = 'Monday';

// Helper: Calculate ISO string for future dates in local time
function getFutureDate(daysFromNow, timeStr = '23:59') {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const [hours, minutes] = timeStr.split(':');
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

  // Format to YYYY-MM-DDTHH:mm
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hh}:${mm}`;
}

// ==========================================
// 2. LocalStorage Engine
// ==========================================

const STORAGE_KEY = 'studymate_app_data_v1';

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      appData = JSON.parse(saved);
      // Guarantee fallback keys if someone cleared individual parts
      if (!appData.assignments) appData.assignments = [];
      if (!appData.tasks) appData.tasks = [];
      if (!appData.timetable) appData.timetable = [];
    } else {
      // First-time visit: populate demo data
      appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
      saveData();
    }
  } catch (err) {
    console.error('Error loading data from LocalStorage:', err);
    appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    updateSidebarBadges();
    updateDashboardKPIs();
  } catch (err) {
    console.error('Error saving data to LocalStorage:', err);
    showToast('Failed to save data. Local storage might be full.', 'danger');
  }
}

function resetToDefaultData() {
  if (confirm('Are you sure you want to reset all data back to the demo defaults? Any custom items will be replaced.')) {
    appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    saveData();
    renderAll();
    showToast('Demo data restored successfully!', 'success');
  }
}

// ==========================================
// 3. Navigation & Responsive Sidebar
// ==========================================

function initNavigation() {
  const navButtons = document.querySelectorAll('.sidebar-nav .nav-item');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-view');
      switchView(targetView);
      closeMobileSidebar();
    });
  });

  // Mobile menu buttons
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const closeSidebarBtn = document.getElementById('close-sidebar-btn');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebar = document.getElementById('sidebar');

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      sidebarOverlay.classList.add('active');
    });
  }

  if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', closeMobileSidebar);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (sidebarOverlay) sidebarOverlay.classList.remove('active');
}

function switchView(viewName) {
  // Update sidebar button active state
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Hide all views, display the selected view
  document.querySelectorAll('.content-view').forEach(view => {
    view.classList.remove('active');
  });

  const targetViewEl = document.getElementById(`view-${viewName}`);
  if (targetViewEl) {
    targetViewEl.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Refresh view specific elements
  if (viewName === 'dashboard') {
    renderDashboard();
  } else if (viewName === 'assignments') {
    renderAssignments();
  } else if (viewName === 'tasks') {
    renderTasks();
  } else if (viewName === 'timetable') {
    renderTimetable();
  } else if (viewName === 'progress') {
    renderProgressAnalytics();
  }
}

// ==========================================
// 4. Dynamic Greeting & Date Logic
// ==========================================

function updateGreetingAndDate() {
  const now = new Date();
  const hour = now.getHours();

  let greetingText = 'Good evening';
  if (hour >= 5 && hour < 12) {
    greetingText = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    greetingText = 'Good afternoon';
  }

  const greetingEl = document.getElementById('greeting-title');
  if (greetingEl) {
    greetingEl.innerHTML = `${greetingText}, Scholar! 👋`;
  }

  // Format date: "Monday, Nov 23, 2026"
  const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  const formattedDate = now.toLocaleDateString(undefined, options);

  const dateEl = document.getElementById('current-date');
  if (dateEl) {
    dateEl.textContent = formattedDate;
  }

  // Detect current day for timetable default
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = days[now.getDay()];
  if (todayDay !== 'Sunday') {
    currentTimetableDay = todayDay;
  } else {
    currentTimetableDay = 'Monday'; // Default to Monday if Sunday
  }
}

// ==========================================
// 5. Sidebar Badges & Top KPIs
// ==========================================

function updateSidebarBadges() {
  const pendingAssignments = appData.assignments.filter(a => !a.completed).length;
  const pendingTasks = appData.tasks.filter(t => !t.completed).length;

  const assignBadge = document.getElementById('badge-assignments-pending');
  if (assignBadge) {
    assignBadge.textContent = pendingAssignments;
    assignBadge.style.display = pendingAssignments > 0 ? 'inline-block' : 'none';
  }

  const taskBadge = document.getElementById('badge-tasks-pending');
  if (taskBadge) {
    taskBadge.textContent = pendingTasks;
    taskBadge.style.display = pendingTasks > 0 ? 'inline-block' : 'none';
  }
}

function updateDashboardKPIs() {
  // 1. Pending Assignments
  const pendingAssignments = appData.assignments.filter(a => !a.completed).length;
  const pendingAssignEl = document.getElementById('stat-pending-assignments');
  if (pendingAssignEl) pendingAssignEl.textContent = pendingAssignments;

  // 2. Daily Tasks Done
  const totalTasks = appData.tasks.length;
  const completedTasks = appData.tasks.filter(t => t.completed).length;
  const completedTasksEl = document.getElementById('stat-completed-tasks');
  if (completedTasksEl) {
    completedTasksEl.textContent = `${completedTasks}/${totalTasks}`;
  }

  // 3. Today's Classes
  const todayClasses = appData.timetable.filter(c => c.day === currentTimetableDay).length;
  const todayClassesEl = document.getElementById('stat-today-classes');
  if (todayClassesEl) todayClassesEl.textContent = todayClasses;

  // 4. Overall Completion Rate
  const totalItems = appData.assignments.length + totalTasks;
  const completedItems = appData.assignments.filter(a => a.completed).length + completedTasks;
  const overallRate = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
  const overallEl = document.getElementById('stat-overall-progress');
  if (overallEl) overallEl.textContent = `${overallRate}%`;
}

// ==========================================
// 6. Dashboard View Rendering
// ==========================================

function renderDashboard() {
  updateDashboardKPIs();

  // 1. Render Dashboard Upcoming Assignments Preview (Top 3 pending)
  const dashAssignList = document.getElementById('dash-assignments-list');
  if (dashAssignList) {
    const upcoming = appData.assignments
      .filter(a => !a.completed)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3);

    if (upcoming.length === 0) {
      dashAssignList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎉</div>
          <p class="empty-title">All caught up!</p>
          <p class="empty-hint">No pending assignments due.</p>
        </div>
      `;
    } else {
      dashAssignList.innerHTML = upcoming.map(item => {
        const { label, isOverdue } = formatDueDate(item.dueDate);
        return `
          <div class="task-item">
            <div class="task-left">
              <input type="checkbox" class="task-checkbox" onchange="toggleAssignmentStatus('${item.id}')">
              <div class="task-content">
                <span class="task-name">${escapeHTML(item.title)}</span>
                <div class="task-meta">
                  <span class="task-category-tag">${escapeHTML(item.subject)}</span>
                  <span class="task-duration ${isOverdue ? 'due-time overdue' : ''}">⏰ ${label}</span>
                </div>
              </div>
            </div>
            <span class="priority-badge badge-${item.priority.toLowerCase()}">${item.priority}</span>
          </div>
        `;
      }).join('');
    }
  }

  // 2. Render Dashboard Today's Tasks & Progress Fill
  const totalTasks = appData.tasks.length;
  const completedTasks = appData.tasks.filter(t => t.completed).length;
  const taskPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const dashTaskFill = document.getElementById('dash-task-fill');
  const dashTaskPercent = document.getElementById('dash-task-percent');
  if (dashTaskFill) dashTaskFill.style.width = `${taskPercent}%`;
  if (dashTaskPercent) dashTaskPercent.textContent = `${taskPercent}%`;

  const dashTasksList = document.getElementById('dash-tasks-list');
  if (dashTasksList) {
    if (appData.tasks.length === 0) {
      dashTasksList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <p class="empty-title">No daily study tasks</p>
          <p class="empty-hint">Add a quick study goal above!</p>
        </div>
      `;
    } else {
      dashTasksList.innerHTML = appData.tasks.slice(0, 4).map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
          <div class="task-left">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskStatus('${task.id}')">
            <div class="task-content">
              <span class="task-name">${escapeHTML(task.title)}</span>
              <div class="task-meta">
                <span class="task-category-tag">${escapeHTML(task.category)}</span>
                ${task.duration ? `<span class="task-duration">⏱️ ${escapeHTML(task.duration)}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // 3. Render Dashboard Today's Timetable Preview
  const dashTodayName = document.getElementById('dash-today-name');
  if (dashTodayName) {
    dashTodayName.textContent = `Schedule for today (${currentTimetableDay})`;
  }

  const dashTimetableList = document.getElementById('dash-timetable-list');
  if (dashTimetableList) {
    const todayClasses = appData.timetable
      .filter(c => c.day === currentTimetableDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (todayClasses.length === 0) {
      dashTimetableList.innerHTML = `
        <div class="empty-state full-width">
          <div class="empty-icon">🌴</div>
          <p class="empty-title">No classes scheduled for today!</p>
          <p class="empty-hint">Enjoy your study break or catch up on reading.</p>
        </div>
      `;
    } else {
      dashTimetableList.innerHTML = todayClasses.map(cls => `
        <div class="class-card">
          <div class="class-time">
            <span>🕒 ${formatTime12Hour(cls.startTime)} - ${formatTime12Hour(cls.endTime)}</span>
          </div>
          <h4 class="class-subject">${escapeHTML(cls.subject)}</h4>
          <div class="class-details">
            <div class="class-room">📍 <span>${escapeHTML(cls.room)}</span></div>
            ${cls.instructor ? `<div class="class-instructor">👨‍🏫 <span>${escapeHTML(cls.instructor)}</span></div>` : ''}
          </div>
        </div>
      `).join('');
    }
  }
}

// ==========================================
// 7. Assignments Management Module
// ==========================================

function initAssignmentsModule() {
  // Filter tabs
  const filterBtns = document.querySelectorAll('.filter-tabs .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAssignmentFilter = btn.getAttribute('data-assignment-filter');
      renderAssignments();
    });
  });

  // Search input
  const searchInput = document.getElementById('assignment-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentAssignmentSearch = e.target.value.trim().toLowerCase();
      renderAssignments();
    });
  }

  // Add Assignment Form Submit
  const formAssignment = document.getElementById('form-assignment');
  if (formAssignment) {
    formAssignment.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('assign-title').value.trim();
      const subject = document.getElementById('assign-subject').value.trim();
      const priority = document.getElementById('assign-priority').value;
      const dueDate = document.getElementById('assign-due').value;
      const notes = document.getElementById('assign-notes').value.trim();

      if (!title || !subject || !dueDate) {
        showToast('Please fill in all required fields.', 'danger');
        return;
      }

      const newAssignment = {
        id: 'assign-' + Date.now(),
        title,
        subject,
        priority,
        dueDate,
        notes,
        completed: false
      };

      appData.assignments.unshift(newAssignment);
      saveData();
      renderAssignments();
      closeModal('modal-assignment');
      formAssignment.reset();
      showToast('Assignment added successfully!', 'success');
    });
  }
}

function renderAssignments() {
  const container = document.getElementById('assignments-container');
  if (!container) return;

  // Filter based on status
  let filtered = appData.assignments.filter(item => {
    if (currentAssignmentFilter === 'pending') return !item.completed;
    if (currentAssignmentFilter === 'completed') return item.completed;
    return true;
  });

  // Filter based on search query
  if (currentAssignmentSearch) {
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(currentAssignmentSearch) ||
      item.subject.toLowerCase().includes(currentAssignmentSearch) ||
      (item.notes && item.notes.toLowerCase().includes(currentAssignmentSearch))
    );
  }

  // Sort: Pending first, then by earliest due date
  filtered.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state full-width">
        <div class="empty-icon">📁</div>
        <p class="empty-title">No assignments found</p>
        <p class="empty-hint">Try adjusting your filter or search, or create a new assignment.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const { label, isOverdue } = formatDueDate(item.dueDate);
    const priorityClass = `priority-${item.priority.toLowerCase()}`;
    const badgeClass = `badge-${item.priority.toLowerCase()}`;

    return `
      <div class="assignment-card ${priorityClass} ${item.completed ? 'completed' : ''}">
        <div>
          <div class="assign-header">
            <div>
              <span class="assign-subject">${escapeHTML(item.subject)}</span>
              <h3 class="assign-title">${escapeHTML(item.title)}</h3>
            </div>
            <span class="priority-badge ${badgeClass}">${item.priority}</span>
          </div>
          ${item.notes ? `<p class="assign-notes">${escapeHTML(item.notes)}</p>` : ''}
        </div>

        <div class="assign-footer">
          <div class="due-time ${isOverdue && !item.completed ? 'overdue' : ''}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>${label}</span>
          </div>

          <div class="assign-actions">
            <button class="btn btn-sm ${item.completed ? 'btn-ghost' : 'btn-primary'}" onclick="toggleAssignmentStatus('${item.id}')">
              ${item.completed ? 'Mark Pending' : '✓ Done'}
            </button>
            <button class="icon-btn btn-sm" onclick="deleteAssignment('${item.id}')" title="Delete Assignment">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleAssignmentStatus(id) {
  const item = appData.assignments.find(a => a.id === id);
  if (item) {
    item.completed = !item.completed;
    saveData();
    renderAssignments();
    renderDashboard();
    renderProgressAnalytics();
    showToast(item.completed ? 'Assignment marked as completed! 🎯' : 'Assignment reopened as pending.', 'info');
  }
}

function deleteAssignment(id) {
  if (confirm('Are you sure you want to delete this assignment?')) {
    appData.assignments = appData.assignments.filter(a => a.id !== id);
    saveData();
    renderAssignments();
    renderDashboard();
    renderProgressAnalytics();
    showToast('Assignment removed.', 'info');
  }
}

// ==========================================
// 8. Daily Study Tasks Module
// ==========================================

function initTasksModule() {
  // Quick Inline Task Form
  const quickTaskForm = document.getElementById('quick-task-form');
  if (quickTaskForm) {
    quickTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('quick-task-input');
      const category = document.getElementById('quick-task-category').value;
      const title = input.value.trim();

      if (!title) return;

      const newTask = {
        id: 'task-' + Date.now(),
        title,
        category,
        duration: '30 mins',
        completed: false
      };

      appData.tasks.unshift(newTask);
      saveData();
      renderTasks();
      renderDashboard();
      input.value = '';
      showToast('Daily task added!', 'success');
    });
  }

  // Modal Add Task Form
  const modalTaskForm = document.getElementById('form-task');
  if (modalTaskForm) {
    modalTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('task-title').value.trim();
      const category = document.getElementById('task-category').value;
      const duration = document.getElementById('task-duration').value.trim() || '30 mins';

      if (!title) return;

      const newTask = {
        id: 'task-' + Date.now(),
        title,
        category,
        duration,
        completed: false
      };

      appData.tasks.unshift(newTask);
      saveData();
      renderTasks();
      renderDashboard();
      closeModal('modal-task');
      modalTaskForm.reset();
      showToast('Daily study task added!', 'success');
    });
  }
}

function renderTasks() {
  const container = document.getElementById('tasks-container');
  if (!container) return;

  const totalTasks = appData.tasks.length;
  const completedTasks = appData.tasks.filter(t => t.completed).length;
  const taskPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Update Tasks View Progress Bar
  const progressBar = document.getElementById('tasks-progress-bar');
  const progressText = document.getElementById('tasks-progress-text');
  const progressBadge = document.getElementById('tasks-progress-badge');

  if (progressBar) progressBar.style.width = `${taskPercent}%`;
  if (progressText) progressText.textContent = `${completedTasks} of ${totalTasks} tasks completed today`;
  if (progressBadge) progressBadge.textContent = `${taskPercent}% Done`;

  if (totalTasks === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <p class="empty-title">No daily study tasks yet</p>
        <p class="empty-hint">Use the quick form above to list today's study goals.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = appData.tasks.map(task => `
    <div class="task-item ${task.completed ? 'completed' : ''}">
      <div class="task-left">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskStatus('${task.id}')">
        <div class="task-content">
          <span class="task-name">${escapeHTML(task.title)}</span>
          <div class="task-meta">
            <span class="task-category-tag">${escapeHTML(task.category)}</span>
            ${task.duration ? `<span class="task-duration">⏱️ ${escapeHTML(task.duration)}</span>` : ''}
          </div>
        </div>
      </div>
      <button class="icon-btn btn-sm" onclick="deleteTask('${task.id}')" title="Delete Task">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `).join('');
}

function toggleTaskStatus(id) {
  const task = appData.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveData();
    renderTasks();
    renderDashboard();
    renderProgressAnalytics();
    showToast(task.completed ? 'Great job! Task checked off! 🚀' : 'Task marked as incomplete.', 'info');
  }
}

function deleteTask(id) {
  appData.tasks = appData.tasks.filter(t => t.id !== id);
  saveData();
  renderTasks();
  renderDashboard();
  renderProgressAnalytics();
  showToast('Task deleted.', 'info');
}

// ==========================================
// 9. Class Timetable Module
// ==========================================

function initTimetableModule() {
  const dayTabs = document.querySelectorAll('.timetable-days-nav .day-tab');
  dayTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      dayTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTimetableDay = tab.getAttribute('data-day');
      renderTimetable();
    });
  });

  // Modal Add Class Form
  const formClass = document.getElementById('form-class');
  if (formClass) {
    formClass.addEventListener('submit', (e) => {
      e.preventDefault();
      const day = document.getElementById('class-day').value;
      const subject = document.getElementById('class-subject').value.trim();
      const startTime = document.getElementById('class-start').value;
      const endTime = document.getElementById('class-end').value;
      const room = document.getElementById('class-room').value.trim();
      const instructor = document.getElementById('class-instructor').value.trim();

      if (!subject || !startTime || !endTime || !room) {
        showToast('Please fill in all required fields.', 'danger');
        return;
      }

      const newClass = {
        id: 'class-' + Date.now(),
        day,
        subject,
        startTime,
        endTime,
        room,
        instructor
      };

      appData.timetable.push(newClass);
      saveData();

      // Switch view to the day that was just added
      currentTimetableDay = day;
      dayTabs.forEach(tab => {
        if (tab.getAttribute('data-day') === day) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      renderTimetable();
      renderDashboard();
      closeModal('modal-class');
      formClass.reset();
      showToast(`Class added to ${day}!`, 'success');
    });
  }
}

function renderTimetable() {
  const container = document.getElementById('timetable-container');
  const dayLabel = document.getElementById('current-day-label');
  const countLabel = document.getElementById('class-count-label');

  if (dayLabel) dayLabel.textContent = `${currentTimetableDay}'s Schedule`;

  const classesForDay = appData.timetable
    .filter(c => c.day === currentTimetableDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (countLabel) {
    countLabel.textContent = `${classesForDay.length} ${classesForDay.length === 1 ? 'Class' : 'Classes'}`;
  }

  if (!container) return;

  if (classesForDay.length === 0) {
    container.innerHTML = `
      <div class="empty-state full-width">
        <div class="empty-icon">📅</div>
        <p class="empty-title">No classes scheduled for ${currentTimetableDay}</p>
        <p class="empty-hint">Click the "Add Class" button above to add a lecture or lab.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = classesForDay.map(cls => `
    <div class="class-card">
      <div>
        <div class="class-time">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>${formatTime12Hour(cls.startTime)} - ${formatTime12Hour(cls.endTime)}</span>
        </div>
        <h3 class="class-subject">${escapeHTML(cls.subject)}</h3>
        <div class="class-details">
          <div class="class-room">
            📍 <span>${escapeHTML(cls.room)}</span>
          </div>
          ${cls.instructor ? `
            <div class="class-instructor">
              👨‍🏫 <span>${escapeHTML(cls.instructor)}</span>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="class-footer">
        <button class="icon-btn btn-sm" onclick="deleteClass('${cls.id}')" title="Delete Class">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

function deleteClass(id) {
  if (confirm('Are you sure you want to remove this class from your timetable?')) {
    appData.timetable = appData.timetable.filter(c => c.id !== id);
    saveData();
    renderTimetable();
    renderDashboard();
    showToast('Class removed from schedule.', 'info');
  }
}

// ==========================================
// 10. Academic Progress & Analytics Module
// ==========================================

function renderProgressAnalytics() {
  // Assignments calculations
  const totalAssign = appData.assignments.length;
  const doneAssign = appData.assignments.filter(a => a.completed).length;
  const pendingAssign = totalAssign - doneAssign;
  const assignRatio = totalAssign === 0 ? 0 : Math.round((doneAssign / totalAssign) * 100);

  const assignPercentEl = document.getElementById('analytics-assign-percent');
  const assignFillEl = document.getElementById('analytics-assign-fill');
  const assignTotalEl = document.getElementById('analytics-assign-total');
  const assignDoneEl = document.getElementById('analytics-assign-done');
  const assignPendingEl = document.getElementById('analytics-assign-pending');

  if (assignPercentEl) assignPercentEl.textContent = `${assignRatio}%`;
  if (assignFillEl) assignFillEl.style.width = `${assignRatio}%`;
  if (assignTotalEl) assignTotalEl.textContent = totalAssign;
  if (assignDoneEl) assignDoneEl.textContent = doneAssign;
  if (assignPendingEl) assignPendingEl.textContent = pendingAssign;

  // Daily Tasks calculations
  const totalTasks = appData.tasks.length;
  const doneTasks = appData.tasks.filter(t => t.completed).length;
  const remainingTasks = totalTasks - doneTasks;
  const taskRatio = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const taskPercentEl = document.getElementById('analytics-task-percent');
  const taskFillEl = document.getElementById('analytics-task-fill');
  const taskTotalEl = document.getElementById('analytics-task-total');
  const taskDoneEl = document.getElementById('analytics-task-done');
  const taskRemainingEl = document.getElementById('analytics-task-remaining');

  if (taskPercentEl) taskPercentEl.textContent = `${taskRatio}%`;
  if (taskFillEl) taskFillEl.style.width = `${taskRatio}%`;
  if (taskTotalEl) taskTotalEl.textContent = totalTasks;
  if (taskDoneEl) taskDoneEl.textContent = doneTasks;
  if (taskRemainingEl) taskRemainingEl.textContent = remainingTasks;
}

// ==========================================
// 11. Modal Window System
// ==========================================

function initModals() {
  // Modal Trigger Buttons
  const openAssignBtn = document.getElementById('open-add-assignment-btn');
  if (openAssignBtn) openAssignBtn.addEventListener('click', () => openModal('modal-assignment'));

  const openTaskBtn = document.getElementById('open-add-task-btn');
  if (openTaskBtn) openTaskBtn.addEventListener('click', () => openModal('modal-task'));

  const openClassBtn = document.getElementById('open-add-class-btn');
  if (openClassBtn) openClassBtn.addEventListener('click', () => openModal('modal-class'));

  // Header Quick Add Button
  const quickAddBtn = document.getElementById('quick-add-btn');
  if (quickAddBtn) {
    quickAddBtn.addEventListener('click', () => {
      // Intelligently open the modal matching the active section
      const activeNav = document.querySelector('.sidebar-nav .nav-item.active');
      const view = activeNav ? activeNav.getAttribute('data-view') : 'dashboard';
      if (view === 'tasks') {
        openModal('modal-task');
      } else if (view === 'timetable') {
        openModal('modal-class');
      } else {
        openModal('modal-assignment');
      }
    });
  }

  // Close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal');
      closeModal(modalId);
    });
  });

  // Close on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(modal => {
        closeModal(modal.id);
      });
    }
  });

  // Reset Demo Data Button
  const resetBtn = document.getElementById('reset-data-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetToDefaultData);
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    // If opening assignment modal, prepopulate due date with tomorrow's evening
    if (modalId === 'modal-assignment') {
      const dueInput = document.getElementById('assign-due');
      if (dueInput && !dueInput.value) {
        dueInput.value = getFutureDate(1, '23:59');
      }
    }
    // If opening class modal, preset to currently selected day
    if (modalId === 'modal-class') {
      const daySelect = document.getElementById('class-day');
      if (daySelect) daySelect.value = currentTimetableDay;
    }
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// ==========================================
// 12. Toast Notification Feedback
// ==========================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'danger') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => {
      if (toast.parentNode) {
        container.removeChild(toast);
      }
    }, 300);
  }, 3200);
}

// ==========================================
// 13. Date & Time Utility Helpers
// ==========================================

function formatDueDate(isoDateStr) {
  if (!isoDateStr) return { label: 'No date', isOverdue: false };

  const dueDate = new Date(isoDateStr);
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffHours = Math.round(diffTime / (1000 * 60 * 60));
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const isOverdue = diffTime < 0;

  let label = '';
  if (isOverdue) {
    const absDays = Math.abs(diffDays);
    label = absDays === 0 ? 'Overdue today' : `Overdue by ${absDays}d`;
  } else if (diffHours <= 24) {
    label = `Due in ${Math.max(1, diffHours)}h`;
  } else if (diffDays === 1) {
    label = 'Due tomorrow';
  } else {
    label = dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return { label, isOverdue };
}

function formatTime12Hour(time24) {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  return `${h}:${minutes} ${ampm}`;
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// 14. Global Initializer
// ==========================================

function renderAll() {
  updateSidebarBadges();
  renderDashboard();
  renderAssignments();
  renderTasks();
  renderTimetable();
  renderProgressAnalytics();
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateGreetingAndDate();
  initNavigation();
  initAssignmentsModule();
  initTasksModule();
  initTimetableModule();
  initModals();
  renderAll();

  // Highlight today's tab in timetable nav
  document.querySelectorAll('.timetable-days-nav .day-tab').forEach(tab => {
    if (tab.getAttribute('data-day') === currentTimetableDay) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
});
