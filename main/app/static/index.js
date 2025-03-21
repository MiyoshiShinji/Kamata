// Step 2: Refactor the animation system first (safest change)
const AnimationSystem = {
    fadeIn(element, delay = 0) {
        gsap.set(element, { display: 'block', opacity: 0 });
        gsap.to(element, {
            opacity: 1,
            duration: 0.2,
            delay: delay,
            ease: 'power2.out'
        });
    },

    fadeOut(element, onComplete = null) {
        gsap.to(element, {
            opacity: 0,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                gsap.set(element, { display: 'none' });
                if (onComplete) onComplete();
            }
        });
    }
};

// Step 3: Refactor tooltips using the animation system
function initializeTooltips() {
    const triggers = document.querySelectorAll('[data-explains]');
    
    triggers.forEach(trigger => {
        const tooltipClass = trigger.dataset.explains;
        const listId = trigger.dataset.list;
        const tooltip = document.querySelector(`.explanation-box.${tooltipClass}[data-list="${listId}"]`);
        
        if (tooltip) {
            trigger.addEventListener('mouseenter', () => {
                AnimationSystem.fadeIn(tooltip, 0.3);
            });

            trigger.addEventListener('mouseleave', () => {
                gsap.killTweensOf(tooltip);
                AnimationSystem.fadeOut(tooltip);
            });
        }
    });
}

// Subpage menus functionality
function initializeSubpageMenus() {
    // More actions menu
    initializeMoreActionsMenu();
    // Add other subpage menu initializations here as needed
}

function initializeMoreActionsMenu() {
    document.querySelectorAll('.list_header-moreactions').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const listId = button.dataset.list;
            const subpage = document.querySelector(`.subpage.list_header-moreactions-menu[data-list="${listId}"]`);
            
            toggleSubpage(subpage);
        });
    });
}

// Reusable function to toggle subpage visibility
function toggleSubpage(subpage) {
    const isHidden = subpage.style.display === 'none' || !subpage.style.display;
    
    if (isHidden) {
        closeAllMenus(subpage);
        AnimationSystem.fadeIn(subpage);
        gsap.to(subpage, { scale: 1, duration: 0.2, ease: 'power2.out' });
    } else {
        gsap.to(subpage, {
            scale: 0.95,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => AnimationSystem.fadeOut(subpage)
        });
    }
}



//drag and drop functions
function initializeSortable() {
    const lists = document.querySelectorAll('.list');
    let pressTimer = null;
    let isDragging = false;
    
    // Add click handler to tasks
    document.querySelectorAll('.list-item').forEach(item => {
        item.addEventListener('mousedown', function(e) {
            pressTimer = setTimeout(() => {
                isDragging = true;
            }, 150); // Wait 150ms before allowing drag
        });

        item.addEventListener('mouseup', function(e) {
            clearTimeout(pressTimer);
            if (!isDragging) {
                // This was a click, not a drag
                this.click(); // Simplified since the item itself is now the trigger
            }
            isDragging = false;
        });

        item.addEventListener('selectstart', function(e) {
            if (isDragging) {
                e.preventDefault();
            }
        });
    });
    
    lists.forEach(list => {
        new Sortable(list, {
            group: 'tasks',
            animation: 150,
            ghostClass: 'task-ghost',
            chosenClass: 'task-chosen',
            dragClass: 'task-drag',
            filter: '.list-header, .list_empty, .explanation-box, .subpage',
            draggable: '.w-layout-grid.list-item',
            delay: 150, // Match the pressTimer delay
            delayOnTouchOnly: true, // Only delay for touch devices
            
            onStart: function(evt) {
                isDragging = true;
            },
            
            onEnd: function(evt) {
                const taskId = evt.item.dataset.item;
                const newListId = evt.to.dataset.list;
                const newIndex = evt.newIndex;
                
                updateTaskPosition(taskId, newListId, newIndex);
                updateListsUI();
                
                setTimeout(() => {
                    isDragging = false;
                }, 0);
            }
        });
    });
}
function updateListsUI() {
    document.querySelectorAll('.list').forEach(list => {
        const tasks = list.querySelectorAll('.list-item');
        const emptyState = list.querySelector('.list_empty');
        const totalElement = list.querySelector('.text.list_header-total');
        
        // Update total count
        if (totalElement) {
            totalElement.textContent = tasks.length;
        }
        
        // Show/hide empty state with opacity and display
        if (emptyState) {
            if (tasks.length === 0) {
                AnimationSystem.fadeIn(emptyState);
            } else {
                AnimationSystem.fadeOut(emptyState);
            }
        }
    });
}
async function updateTaskPosition(taskId, listId, position) {
    try {
        const response = await fetch('/api/update-task-position/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                task_id: taskId,
                list_id: listId,
                position: position
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update task position');
        }
    } catch (error) {
        console.error('Error updating task position:', error);
    }
}


//click: close subpage (click outside)
function closeAllMenus(exceptSubpage = null) {
    // Close subpage menus
    document.querySelectorAll('.subpage.list_header-moreactions-menu').forEach(subpage => {
        if (subpage !== exceptSubpage && subpage.style.display !== 'none') {
            gsap.to(subpage, {
                scale: 0.95,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: () => AnimationSystem.fadeOut(subpage)
            });
        }
    });
}
document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-popup-trigger]')) {
        closeAllMenus();
    }
});



//cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}




//list title editing
function initializeListTitleEditing() {
    const MAX_TITLE_LENGTH = 25;

    document.querySelectorAll('.list_header-title').forEach(title => {
        title.addEventListener('click', function() {
            const currentText = this.textContent;
            this.setAttribute('contenteditable', 'true');
            this.classList.add('editing');
            this.focus();

            // Save on enter or blur
            const saveChanges = () => {
                const newText = this.textContent.trim().substring(0, MAX_TITLE_LENGTH);
                this.textContent = newText; // Ensure the text is truncated
                if (newText !== currentText) {
                    const listId = this.closest('[data-list]').dataset.list;
                    updateListTitle(listId, newText);
                }
                this.setAttribute('contenteditable', 'false');
                this.classList.remove('editing');
            };

            // Prevent typing beyond max length
            this.addEventListener('input', function(e) {
                if (this.textContent.length > MAX_TITLE_LENGTH) {
                    this.textContent = this.textContent.substring(0, MAX_TITLE_LENGTH);
                    // Place cursor at end
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.setStart(this.childNodes[0], MAX_TITLE_LENGTH);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            });

            this.addEventListener('blur', saveChanges, { once: true });
            this.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.blur();
                }
                if (e.key === 'Escape') {
                    this.textContent = currentText;
                    this.blur();
                }
            });
        });
    });
}
document.querySelectorAll('.rename-section').forEach(button => {
    button.addEventListener('click', function() {
        const listId = this.closest('[data-list]').dataset.list;
        const titleElement = this.closest('.list').querySelector('.list_header-title');
        titleElement.click(); // Trigger the existing edit functionality
    });
});
async function updateListTitle(listId, newTitle) {
    try {
        const response = await fetch('/api/update-list-title/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                list_id: listId,
                title: newTitle
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update list title');
        }
    } catch (error) {
        console.error('Error updating list title:', error);
    }
}

function initializeAddSection() {
    const addSectionWrapper = document.querySelector('.add-section-wrapper');
    const titleElement = addSectionWrapper.querySelector('.add-section-title');
    const MAX_TITLE_LENGTH = 25;

    addSectionWrapper.addEventListener('click', function() {
        titleElement.textContent = '';
        titleElement.setAttribute('contenteditable', 'true');
        titleElement.classList.add('editing');
        titleElement.focus();

        const saveNewSection = async () => {
            const newTitle = titleElement.textContent.trim().substring(0, MAX_TITLE_LENGTH);
            if (newTitle && newTitle !== 'Add section') {
                const newList = await createNewList(newTitle);
                if (newList) {
                    window.location.reload(); // Refresh to show new list
                }
            }
            titleElement.textContent = 'Add section';
            titleElement.setAttribute('contenteditable', 'false');
            titleElement.classList.remove('editing');
        };

        titleElement.addEventListener('blur', saveNewSection, { once: true });
        titleElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                titleElement.blur();
            }
            if (e.key === 'Escape') {
                titleElement.textContent = 'Add section';
                titleElement.blur();
            }
        });
    });
}

async function createNewList(title) {
    try {
        const response = await fetch('/api/create-list/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ title })
        });

        if (!response.ok) throw new Error('Failed to create list');
        return await response.json();
    } catch (error) {
        console.error('Error creating list:', error);
        return null;
    }
}

// Reusable function for making elements editable
function makeEditable(element, options = {}) {
    const {
        maxLength = 25,
        onSave = null,
        defaultText = '',
        saveOnEnter = true,
        clearOnEdit = false
    } = options;

    element.addEventListener('click', function(e) {
        e.stopPropagation();
        const currentText = this.textContent;
        
        if (clearOnEdit) {
            this.textContent = '';
        }
        
        this.setAttribute('contenteditable', 'true');
        this.classList.add('editing');
        this.focus();

        const saveChanges = () => {
            const newText = this.textContent.trim().substring(0, maxLength);
            
            if (!newText && clearOnEdit) {
                this.textContent = currentText;
                // Remove the has-content class if reverting to default text
                if (this.classList.contains('create-task-popup_task-name')) {
                    this.classList.remove('has-content');
                }
            } else {
                this.textContent = newText || defaultText;
                // Add has-content class if there's user-entered text
                if (this.classList.contains('create-task-popup_task-name') && newText !== defaultText) {
                    this.classList.add('has-content');
                }
            }
            
            this.setAttribute('contenteditable', 'false');
            this.classList.remove('editing');
            
            if (onSave && newText !== currentText && newText !== '') {
                onSave(newText);
            }
        };

        this.addEventListener('blur', saveChanges, { once: true });
        
        if (saveOnEnter) {
            this.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.blur();
                }
                if (e.key === 'Escape') {
                    this.textContent = currentText;
                    if (this.classList.contains('create-task-popup_task-name')) {
                        this.classList.remove('has-content');
                    }
                    this.blur();
                }
            });
        }
    });
}

function initializePopups() {
    // Open popup
    document.querySelectorAll('[data-popup-trigger]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            const popupName = trigger.dataset.popupTrigger;
            const listId = trigger.dataset.list;
            const popup = document.querySelector(`[data-popup="${popupName}"]`);
            
            if (popup) {
                popup.dataset.currentList = listId;
                popup.style.display = 'flex';
                gsap.fromTo(popup, 
                    { opacity: 0 },
                    { opacity: 1, duration: 0.5, ease: 'power2.out' }
                );

                // Initialize both title and description with the same logic
                popup.querySelectorAll('.create-task-popup_task-name, .create-task-popup_description-area').forEach(element => {
                    makeEditable(element, {
                        defaultText: element.classList.contains('create-task-popup_task-name') ? 'Add task name...' : 'Add description...',
                        maxLength: element.classList.contains('create-task-popup_task-name') ? 50 : 500,
                        saveOnEnter: element.classList.contains('create-task-popup_task-name'),
                        clearOnEdit: true,
                        onSave: (newText) => {
                            if (newText !== element.defaultText) {
                                element.classList.add('has-content');
                            } else {
                                element.classList.remove('has-content');
                            }
                        }
                    });
                });

                // Initialize the project dropdown when popup opens
                initializeProjectDropdown();
            }
        });
    });

    // Close popup - unified handler for all popups
    document.querySelectorAll('[data-popup-close]').forEach(closeButton => {
        closeButton.addEventListener('click', () => {
            const popupName = closeButton.dataset.popupClose;
            const popup = document.querySelector(`[data-popup="${popupName}"]`);
            
            if (popup) {
                gsap.to(popup, {
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                        popup.style.display = 'none';
                        // Reset based on popup type
                        if (popupName === 'create-task') {
                            resetTaskPopup();
                        } else if (popupName === 'edit-task') {
                            resetEditTaskPopup();
                        }
                    }
                });
            }
        });
    });

    // Handle escape key - unified handler for all popups
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const visiblePopup = document.querySelector('.create-task-popup[style*="flex"], .edit-task-popup[style*="flex"]');
            if (visiblePopup) {
                const popupName = visiblePopup.dataset.popup;
                gsap.to(visiblePopup, {
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                        visiblePopup.style.display = 'none';
                        // Reset based on popup type
                        if (popupName === 'create-task') {
                            resetTaskPopup();
                        } else if (popupName === 'edit-task') {
                            resetEditTaskPopup();
                        }
                    }
                });
            }
        }
    });

    // Handle clicking outside - unified handler for all popups
    document.querySelectorAll('[data-popup]').forEach(popup => {
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {  // Only if clicking the backdrop
                const popupName = popup.dataset.popup;
                gsap.to(popup, {
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.out',
                    onComplete: () => {
                        popup.style.display = 'none';
                        // Reset based on popup type
                        if (popupName === 'create-task') {
                            resetTaskPopup();
                        } else if (popupName === 'edit-task') {
                            resetEditTaskPopup();
                        }
                    }
                });
            }
        });
    });
}

function resetTaskPopup() {
    const popup = document.querySelector('.create-task-popup');
    
    // Reset description to default text
    const descriptionElement = popup.querySelector('.create-task-popup_description-area');
    descriptionElement.textContent = "Design a sleek landing page for a car enthusiast website, featuring high-quality images, a modern UI, and interactive elements like a car comparison tool. Ensure responsiveness and optimize for fast loading speeds across all devices.";
    
    // Reset other fields...
    const taskNameElement = popup.querySelector('[data-task-field="name"]');
    taskNameElement.textContent = 'Add task name...';
    taskNameElement.classList.remove('has-content', 'error');

    const statusElement = popup.querySelector('.list_item-status');
    statusElement.className = 'list_item-status not-selected';
    statusElement.querySelector('.create-task-popup_status.inner-text').textContent = 'Null';

    const priorityElement = popup.querySelector('.list_item-priority');
    priorityElement.className = 'list_item-priority not-selected';
    priorityElement.querySelector('.create-task-popup_priority.inner-text').textContent = 'Null';

    // Reset dates
    const startDateInput = document.getElementById('taskStartDate');
    const endDateInput = document.getElementById('taskEndDate');
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
}

document.querySelector('[data-popup-action="delete-list"]').addEventListener('click', async function() {
    const popup = document.querySelector('.delete-list-popup');
    const listId = popup.dataset.currentList;
    const deleteOption = document.querySelector('input[name="delete-option"]:checked').value;
    
    try {
        const response = await fetch('/api/delete-list/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                list_id: listId,
                delete_tasks: deleteOption === 'delete'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to delete list');
        }

        const listElement = document.querySelector(`[data-list="${listId}"]`);
        const firstList = document.querySelector('[data-list="1"]');
        
        if (listElement && deleteOption === 'keep') {
            // Get all tasks from the list being deleted
            const tasks = Array.from(listElement.querySelectorAll('.list-item'));
            
            // Create and position clones
            const clones = tasks.map(task => {
                const rect = task.getBoundingClientRect();
                const clone = task.cloneNode(true);
                
                // Add clone to first list immediately
                firstList.appendChild(clone);
                
                return {
                    element: clone,
                    start: {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width
                    },
                    end: clone.getBoundingClientRect()
                };
            });

            // Batch animate all clones
            gsap.set(clones.map(c => c.element), {
                position: 'fixed',
                top: i => clones[i].start.top,
                left: i => clones[i].start.left,
                width: i => clones[i].start.width,
                zIndex: 1000
            });

            gsap.to(clones.map(c => c.element), {
                top: i => clones[i].end.top,
                left: i => clones[i].end.left,
                duration: 0.3,
                ease: 'power2.inOut',
                stagger: 0.02,
                onComplete: () => {
                    clones.forEach(({ element }) => {
                        gsap.set(element, { clearProps: 'all' });
                    });
                    updateListsUI();
                }
            });

            // Animate list removal simultaneously
            gsap.to(listElement, {
                opacity: 0,
                height: 0,
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => listElement.remove()
            });
        } else if (listElement) {
            // Just remove the list if we're deleting everything
            gsap.to(listElement, {
                opacity: 0,
                height: 0,
                duration: 0.3,
                ease: 'power2.out',
                onComplete: () => listElement.remove()
            });
        }

        // Close the popup
        const closeButton = document.querySelector('[data-popup-close="delete-list"]');
        closeButton.click();

    } catch (error) {
        console.error('Error deleting list:', error);
    }
});

// Initialize list title editing
document.querySelectorAll('.list_header-title').forEach(title => {
    makeEditable(title, {
        onSave: (newText) => {
            const listId = title.closest('[data-list]').dataset.list;
            updateListTitle(listId, newText);
        },
        clearOnEdit: true  // Enable clearing for list titles
    });
});













//project selection method
    function initializeProjectDropdown() {
        const dropdownContainers = document.querySelectorAll('.project-dropdown-container');
        
        dropdownContainers.forEach(container => {
            const header = container.querySelector('.project-dropdown-header');
            const list = container.querySelector('.project-dropdown-list');
            
            // Clean up old listener by cloning
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            // Add new listener
            newHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = list.style.display === 'block';
                list.style.display = isVisible ? 'none' : 'block';
            });

            // Handle option selection
            container.querySelectorAll('.project-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const newText = option.querySelector('span').textContent;
                    newHeader.querySelector('.selected-project-text').textContent = newText;
                    container.dataset.selectedProjectId = option.dataset.projectId;
                    list.style.display = 'none';
                });
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            dropdownContainers.forEach(container => {
                const list = container.querySelector('.project-dropdown-list');
                list.style.display = 'none';
            });
        });
    }

    // status and priority selection method
    function initializeStatusCycling() {
        const statusStates = [
            { value: '4', class: '', text: 'Null' },
            { value: '1', class: 'on_track', text: 'On track' },
            { value: '2', class: 'at_risk', text: 'At risk' },
            { value: '3', class: 'off_track', text: 'Off track' }
        ];

        document.querySelectorAll('.list_item-status').forEach(statusElement => {
            let currentStateIndex = 0;

            statusElement.addEventListener('click', function() {
                // Remove all possible status classes except 'not-selected'
                statusStates.forEach(state => {
                    if (state.class) {
                        this.classList.remove(state.class);
                    }
                });

                // Move to next state (or back to start)
                currentStateIndex = (currentStateIndex + 1) % statusStates.length;
                const newState = statusStates[currentStateIndex];

                // Apply new class (if any) while keeping 'not-selected'
                if (newState.class) {
                    this.classList.add(newState.class);
                }

                // Update the data attribute and inner text
                this.dataset.statusValue = newState.value;
                const innerTextElement = this.querySelector('.create-task-popup_status.inner-text');
                if (innerTextElement) {
                    innerTextElement.textContent = newState.text;
                }
            });
        });
    }
    function initializePriorityCycling() {
        const priorityStates = [
            { value: '4', class: '', text: 'Null' },
            { value: '1', class: 'low', text: 'Low' },
            { value: '2', class: 'medium', text: 'Medium' },
            { value: '3', class: 'high', text: 'High' }
        ];

        document.querySelectorAll('.list_item-priority').forEach(priorityElement => {
            let currentStateIndex = 0;

            priorityElement.addEventListener('click', function() {
                // Remove all possible priority classes except 'not-selected'
                priorityStates.forEach(state => {
                    if (state.class) {
                        this.classList.remove(state.class);
                    }
                });

                // Move to next state (or back to start)
                currentStateIndex = (currentStateIndex + 1) % priorityStates.length;
                const newState = priorityStates[currentStateIndex];

                // Apply new class (if any) while keeping 'not-selected'
                if (newState.class) {
                    this.classList.add(newState.class);
                }

                // Update the data attribute and inner text
                this.dataset.priorityValue = newState.value;
                const innerTextElement = this.querySelector('.create-task-popup_priority.inner-text');
                if (innerTextElement) {
                    innerTextElement.textContent = newState.text;
                }
            });
        });
    }

    // task creation method
    document.querySelector('[data-popup-action="create-task"]').addEventListener('click', async function(e) {
        e.preventDefault();
        const popup = document.querySelector('.create-task-popup');
        const listId = popup.dataset.currentList;
        const taskNameElement = popup.querySelector('[data-task-field="name"]');
        const taskName = taskNameElement.textContent.trim();
        
        // Get description
        const descriptionElement = popup.querySelector('.create-task-popup_description-area');
        const defaultDescription = "Design a sleek landing page for a car enthusiast website, featuring high-quality images, a modern UI, and interactive elements like a car comparison tool. Ensure responsiveness and optimize for fast loading speeds across all devices.";
        const description = descriptionElement.textContent.trim();
        const finalDescription = description === defaultDescription ? null : description;
        
        // Get project ID and log it
        const projectContainer = popup.querySelector('.project-dropdown-container');
        const projectId = projectContainer.dataset.selectedProjectId;
        console.log('Selected Project Container:', projectContainer);
        console.log('Project ID before sending:', projectId);
        console.log('Project Container dataset:', projectContainer.dataset);

        // Get other values
        const statusElement = popup.querySelector('.list_item-status');
        const priorityElement = popup.querySelector('.list_item-priority');
        const statusValue = parseInt(statusElement.dataset.statusValue) || 4;
        const priorityValue = parseInt(priorityElement.dataset.priorityValue) || 4;
        const startDateInput = document.getElementById('taskStartDate');
        const endDateInput = document.getElementById('taskEndDate');
        const startDate = startDateInput.value || null;
        const endDate = endDateInput.value || null;

        // Validate task name
        if (!taskName || taskName === 'Add task name...') {
            taskNameElement.classList.add('error');
            return;
        }

        const requestBody = {
            name: taskName,
            list_id: listId,
            project_id: projectId,
            status: statusValue,
            priority: priorityValue,
            description: finalDescription,
            start_date: startDate,
            end_date: endDate
        };
        
        console.log('Request body:', requestBody);

        try {
            const response = await fetch('/api/create-task/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server error:', errorData);
                throw new Error(`Server error: ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            console.log('Response from server:', data);
            
            if (data.status === 'success') {
                if (!data.task.project_id && projectId) {
                    console.error('Project ID was not saved correctly:', {
                        sent: projectId,
                        received: data.task.project_id
                    });
                }
                resetTaskPopup();
                popup.style.display = 'none';
                location.reload();
            } else {
                throw new Error(data.message || 'Failed to create task');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            // You might want to show an error message to the user here
        }
    });

// Add to your existing initialization code
document.addEventListener('DOMContentLoaded', () => {
    initializeTooltips();
    initializeSubpageMenus();
    initializeSortable();
    initializeListTitleEditing();
    initializeAddSection();
    initializePopups();
    initializeStatusCycling();
    initializePriorityCycling();
    initializeProjectDropdown();
});
