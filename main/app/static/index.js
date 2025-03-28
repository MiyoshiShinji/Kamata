// Add this at the top of the file, before any functions
let isDragging = false;

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
        item.addEventListener('mousedown', function (e) {
            pressTimer = setTimeout(() => {
                isDragging = true;
            }, 150); // Wait 150ms before allowing drag
        });

        item.addEventListener('mouseup', function (e) {
            clearTimeout(pressTimer);
            if (!isDragging) {
                // This was a click, not a drag
                this.click(); // Simplified since the item itself is now the trigger
            }
            isDragging = false;
        });

        item.addEventListener('selectstart', function (e) {
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

            onStart: function (evt) {
                isDragging = true;
            },

            onEnd: function (evt) {
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
        title.addEventListener('click', function () {
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
            this.addEventListener('input', function (e) {
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
    button.addEventListener('click', function () {
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

    addSectionWrapper.addEventListener('click', function () {
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

    element.addEventListener('click', function (e) {
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
                if (this.classList.contains('edit-task-popup_task-name')) {
                    this.classList.remove('has-content');
                }
            } else {
                this.textContent = newText || defaultText;
                if (this.classList.contains('edit-task-popup_task-name') && newText !== defaultText) {
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
                    if (this.classList.contains('edit-task-popup_task-name')) {
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
                        resetTaskPopup(popup);
                        console.log('popup foi resetado');
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
                        resetTaskPopup(popup);
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
                        resetTaskPopup();
                    }
                });
            }
        });
    });
}

function resetTaskPopup(popupElement) {
    const popup = popupElement;
    // Reset description to default text
    const descriptionElement = popup.querySelector('[data-popup-description');
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

    // Reset project selection
    const projectContainer = popup.querySelector('.project-dropdown-container');
    const projectTitleElement = projectContainer.querySelector('[data-project-selection-title]');
    projectTitleElement.textContent = 'No project';
    projectContainer.dataset.selectedProjectId = 'null';


    // Reset dates
    const startDateInput = popup.querySelector('[id="taskStartDate"]');
    const endDateInput = popup.querySelector('[id="taskEndDate"]');

    startDateInput.value = '';
    endDateInput.value = '';
    startDateInput.placeholder = 'Start date';
    endDateInput.placeholder = 'Deadline';


}

function handleListDelete() {
    document.querySelector('[data-popup-action="delete-list"]').addEventListener('click', async function () {
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
            const firstList = document.querySelector('[data-list="first"]');

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
}


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


function initializeTaskEdit() {
    if (window.taskEditInitialized) return;
    window.taskEditInitialized = true;

    document.addEventListener('click', function (e) {
        const task = e.target.closest('.list-item');
        if (!task || !task.dataset.editMode || isDragging) return;

        e.stopPropagation();
        const popup = document.querySelector('[data-popup="edit-task"]');
        if (!popup) return;

        // Helper function to update popup elements
        const updatePopupElement = (popupSelector, taskSelector, className = null) => {
            const popupElement = popup.querySelector(popupSelector);
            const taskElement = task.querySelector(taskSelector);
            if (!popupElement || !taskElement) return;

            if (className) {
                popupElement.className = taskElement.className;
            }

            // Copy all data attributes
            Object.keys(taskElement.dataset).forEach(key => {
                popupElement.dataset[key] = taskElement.dataset[key];
            });

            // Update text content if inner-text element exists
            const innerText = popupElement.querySelector('.inner-text');
            if (innerText) {
                innerText.textContent = taskElement.textContent;
            }
        };

        // Update task name and make it editable
        const nameField = popup.querySelector('.edit-task-popup_task-name');
        if (nameField) {
            const currentText = task.querySelector('.list_item-title').textContent;
            nameField.textContent = currentText;
            nameField.classList.add('has-content');

            // Initialize editable functionality
            makeEditable(nameField, {
                maxLength: 50,
                saveOnEnter: true,
                clearOnEdit: true,  // Add this option
                onSave: (newText) => {
                    const trimmedText = newText.trim();
                    if (trimmedText) {
                        nameField.classList.add('has-content');
                        nameField.textContent = trimmedText;
                    } else {
                        nameField.classList.remove('has-content');
                        nameField.textContent = currentText; // Restore original text if empty
                    }
                }
            });
        }

        // Store task ID
        popup.dataset.currentTask = task.dataset.taskId;

        // Update status and priority
        updatePopupElement('.list_item-status', '.list_item-status', true);
        updatePopupElement('.list_item-priority', '.list_item-priority', true);

        // Update project selection
        const projectContainer = popup.querySelector('.project-dropdown-container');
        const taskProjectName = task.dataset.itemProjectName; // Get the task's project ID

        if (projectContainer) {
            let headerText = projectContainer.querySelector('[data-project-selection-title]');

            if (!taskProjectName || taskProjectName === 'null') {
                headerText.textContent = 'No project';
                projectContainer.dataset.selectedProjectId = 'null';
            } else {
                headerText.textContent = taskProjectName;
                projectContainer.dataset.selectedProjectId = task.dataset.itemProjectId;

            }
        }

        const descriptionField = popup.querySelector('[data-popup-description]');
        if (descriptionField.textContent === 'None') {
            descriptionField.textContent = 'Null';
        } else {
            descriptionField.textContent = task.dataset.itemDescription;
        }

        let taskDeadlineElement = popup.querySelector('[data-data-input-deadline]');
        if(task.dataset.itemDeadline === "None"){
            taskDeadlineElement.value = null;
        }
        else{
            taskDeadlineElement.value = task.dataset.itemDeadline;
        }
        

        let taskStartDateElement = popup.querySelector('[data-data-input-startdate]');
        if(task.dataset.itemStartDate === "None"){
            taskStartDateElement.value = null;
        }
        else{
            taskStartDateElement.value = task.dataset.itemStartDate;
        }
        




        // Show and animate popup
        popup.style.display = 'block';
        gsap.fromTo(popup,
            { opacity: 0 },
            { opacity: 1, duration: 0.5, ease: 'power2.out' }
        );

        // Initialize interactive elements
        initializeStatusLoopSelection();
        initializePriorityLoopSelection();
        initializeProjectDropdown();
    });
}


//project selection method
function handleProjectSelection() {
    document.querySelectorAll('.project-dropdown-container').forEach(container => {
        const trigger = container.querySelector('.project-dropdown-header');
        const list = container.querySelector('.project-dropdown-list');

        if (trigger.dataset.initialized) return;

        trigger.dataset.initialized = 'true';
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            list.style.display = list.style.display === 'block' ? 'none' : 'block';
        });

        container.querySelectorAll('.project-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const projectId = option.dataset.projectId;
                const projectName = option.querySelector('span').textContent;

                container.querySelector('[data-project-selection-title]').textContent = projectName;
                container.setAttribute('data-selected-project-id', projectId);
                list.style.display = 'none';
            });
        });
    });
}

function initializeProjectDropdown() {
    document.querySelectorAll('.project-dropdown-container').forEach(container => {
        const trigger = container.querySelector('.project-dropdown-header');
        const list = container.querySelector('.project-dropdown-list');

        if (trigger.dataset.initialized) return;

        trigger.dataset.initialized = 'true';
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            list.style.display = list.style.display === 'block' ? 'none' : 'block';
        });

        container.querySelectorAll('.project-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const projectId = option.dataset.projectId;
                const projectName = option.querySelector('span').textContent;

                container.querySelector('[data-project-selection-title]').textContent = projectName;
                container.setAttribute('data-selected-project-id', projectId);
                list.style.display = 'none';
            });
        });
    });
}

function updateProjectSelectionForEditPopup(task) {
    const popup = document.querySelector('.edit-task-popup');
    const projectContainer = popup.querySelector('.project-dropdown-container');
    const taskProjectId = task.dataset.projectId;

    if (projectContainer) {
        const headerText = projectContainer.querySelector('[data-project-selection-title]');

        if (taskProjectId && taskProjectId !== 'null') {
            const projectOption = popup.querySelector(`.project-option[data-project-id="${taskProjectId}"]`);
            if (projectOption) {
                const projectName = projectOption.querySelector('span').textContent;
                headerText.textContent = projectName;
                projectContainer.dataset.selectedProjectId = taskProjectId;
            }
        } else {
            headerText.textContent = 'No project';
            projectContainer.dataset.selectedProjectId = 'null';
        }
    }
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

        statusElement.addEventListener('click', function () {
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

// status and priority selection method
function initializeStatusLoopSelection() {
    const statusStates = [
        { value: '4', class: '', text: 'Null' },
        { value: '1', class: 'on_track', text: 'On track' },
        { value: '2', class: 'at_risk', text: 'At risk' },
        { value: '3', class: 'off_track', text: 'Off track' }
    ];

    document.querySelectorAll('.list_item-status').forEach(statusElement => {
        if (!statusElement.hasAttribute('data-status-loop-selection')) return;

        statusElement.addEventListener('click', function () {
            // Find current state index based on existing value
            let currentStateIndex = statusStates.findIndex(state =>
                this.dataset.statusValue === state.value
            );

            // If not found or at the end, reset to -1 to start from beginning
            if (currentStateIndex === -1 || currentStateIndex === statusStates.length - 1) {
                currentStateIndex = -1;
            }

            // Move to next state
            const newState = statusStates[currentStateIndex + 1];

            // Reset all classes first
            this.className = 'list_item-status not-selected';
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
function initializePriorityLoopSelection() {
    const priorityStates = [
        { value: '4', class: '', text: 'Null' },
        { value: '1', class: 'low', text: 'Low' },
        { value: '2', class: 'medium', text: 'Medium' },
        { value: '3', class: 'high', text: 'High' }
    ];

    document.querySelectorAll('.list_item-priority').forEach(priorityElement => {
        if (!priorityElement.hasAttribute('data-priority-loop-selection')) return;

        priorityElement.addEventListener('click', function () {
            // Find current state index based on existing value
            let currentStateIndex = priorityStates.findIndex(state =>
                this.dataset.priorityValue === state.value
            );

            // If not found or at the end, reset to -1 to start from beginning
            if (currentStateIndex === -1 || currentStateIndex === priorityStates.length - 1) {
                currentStateIndex = -1;
            }

            // Move to next state
            const newState = priorityStates[currentStateIndex + 1];

            // Reset all classes first
            this.className = 'list_item-priority not-selected';
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

function createTask() {

    document.querySelector('[data-popup-action="create-task"]').addEventListener('click', async function (e) {
        e.preventDefault();
        const popup = document.querySelector('.create-task-popup');
        console.log(popup);
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
}
function updateTask() {
    document.querySelector('[data-popup-action="edit-task"]').addEventListener('click', async function (e) {
        e.preventDefault();

        const popup = document.querySelector('.edit-task-popup');

        // Task ID
        const currentTaskId = popup.dataset.currentTask;
        if (!currentTaskId) {
            console.error('Task ID is missing.');
            return;
        }
        console.log('Task ID:', currentTaskId);

        // Title
        const titleElement = popup.querySelector('[data-task-field="name"]');
        const title = titleElement.textContent.trim();
        if (!title || title === 'Add task name...') {
            titleElement.classList.add('error');
            console.error('Task title is required.');
            return;
        }

        // List ID
        const currentTask = document.querySelector(`[data-item="${currentTaskId}"]`);
        const currentList = currentTask.closest('[data-list]');
        const currentListId = currentList.dataset.list;
        console.log('List ID:', currentListId);

        // Description
        const descriptionElement = popup.querySelector('[data-popup-description]');
        const description = descriptionElement.textContent.trim();
        console.log('Description:', description);

        // Project ID
        const projectContainer = popup.querySelector('.project-dropdown-container');
        let projectId = projectContainer.dataset.selectedProjectId;
        if (projectId === 'null') {
            projectId = null;
        }
        console.log('Project ID:', projectId);

        // Status and Priority
        const statusElement = popup.querySelector('.list_item-status');
        const priorityElement = popup.querySelector('.list_item-priority');
        const statusValue = parseInt(statusElement.dataset.statusValue) || 4;
        const priorityValue = parseInt(priorityElement.dataset.priorityValue) || 4;
        console.log('Status:', statusValue);
        console.log('Priority:', priorityValue);

        // Dates
        const startDateInput = popup.querySelector('[data-data-input-startdate]');
        const endDateInput = popup.querySelector('[data-data-input-deadline]');
        const startDate = startDateInput.value || null;
        const endDate = endDateInput.value || null;
        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);

        // Prepare the request body
        const requestBody = {
            task_id: parseInt(currentTaskId), // Include the task ID
            name: title,
            list_id: parseInt(currentListId),
            project_id: projectId,
            status: statusValue,
            priority: priorityValue,
            description: description,
            start_date: startDate,
            end_date: endDate
        };

        console.log('Request Body:', requestBody);

        // Send the update request
        try {
            const response = await fetch('/api/update-task/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken') // Include CSRF token if needed
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server error:', errorData);
                throw new Error(`Server error: ${errorData.message || response.statusText}`);
            }

            const data = await response.json();

            if (data.status === 'success') {
                console.log('Task updated successfully:', data.task);
                resetTaskPopup(popup);
                popup.style.display = 'none';
                location.reload(); // Reload the page to reflect changes
            } else {
                throw new Error(data.message || 'Failed to update task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            // Optionally, show an error message to the user
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTooltips();
    initializeSubpageMenus();
    initializeSortable();
    initializeListTitleEditing();
    initializeAddSection();
    initializePopups();
    initializeStatusLoopSelection();
    initializePriorityLoopSelection();
    handleProjectSelection();
    initializeTaskEdit();
    updateTask();
    handleListDelete();
    createTask();
});