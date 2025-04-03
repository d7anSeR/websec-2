$(document).ready(function() {
    let currentView = 'group'; // 'group' или 'teacher'
    let currentEntityId = null;
    let currentWeek = 'auto';
    let entities = []; // Список групп или преподавателей
    let filteredEntities = []; // Отфильтрованный список

    // Инициализация приложения
    function init() {
        loadCurrentWeek();
        loadEntities();
        setupEventListeners();
    }

    // Загрузка текущей учебной недели
    function loadCurrentWeek() {
        $.get('/api/current-week', function(data) {
            $('#current-week').text(`Текущая неделя: ${data.isOdd ? 'Нечётная' : 'Чётная'}`);
            if (currentWeek === 'auto') {
                loadSchedule();
            }
        }).fail(function() {
            console.error('Не удалось загрузить текущую неделю');
        });
    }

    // Загрузка списка групп или преподавателей
    function loadEntities() {
        const endpoint = currentView === 'group' ? '/api/groups' : '/api/teachers';
        const $loading = $('#sidebar-loading').show();
        $('#entity-list').empty();

        $.get(endpoint, function(data) {
            entities = data;
            filteredEntities = [...entities];
            renderEntityList();
        }).fail(function() {
            console.error(`Не удалось загрузить ${currentView === 'group' ? 'группы' : 'преподавателей'}`);
        }).always(function() {
            $loading.hide();
        });
    }

    // Отрисовка списка групп/преподавателей
    function renderEntityList() {
        const $entityList = $('#entity-list').empty();
        $('#sidebar-title').text(currentView === 'group' ? 'Группы' : 'Преподаватели');

        if (filteredEntities.length === 0) {
            $entityList.append('<li>Ничего не найдено</li>');
            return;
        }

        filteredEntities.forEach(entity => {
            const name = currentView === 'group' ? entity.name : `${entity.lastName} ${entity.firstName} ${entity.middleName}`;
            $entityList.append(`
                <li data-id="${entity.id}" data-name="${name}">
                    ${name}
                </li>
            `);
        });

        // Выделяем активный элемент, если есть
        if (currentEntityId) {
            $(`#entity-list li[data-id="${currentEntityId}"]`).addClass('active');
        }
    }

    // Загрузка расписания
    function loadSchedule() {
        if (!currentEntityId) return;

        const $loading = $('#schedule-loading').show();
        $('#schedule-content').empty();

        const weekParam = currentWeek === 'auto' ? '' : currentWeek;
        const endpoint = currentView === 'group' 
            ? `/api/schedule/group/${currentEntityId}?week=${weekParam}`
            : `/api/schedule/teacher/${currentEntityId}?week=${weekParam}`;

        $.get(endpoint, function(data) {
            renderSchedule(data);
        }).fail(function() {
            console.error('Не удалось загрузить расписание');
            $('#schedule-content').html('<p>Ошибка при загрузке расписания</p>');
        }).always(function() {
            $loading.hide();
        });
    }

    // Отрисовка расписания
    function renderSchedule(data) {
        const $content = $('#schedule-content').empty();
        const entityName = $(`#entity-list li[data-id="${currentEntityId}"]`).data('name');
        $('#schedule-title').text(`Расписание: ${entityName}`);

        if (!data || !data.days || data.days.length === 0) {
            $content.html('<p>Расписание не найдено</p>');
            return;
        }

        data.days.forEach(day => {
            if (day.lessons.length === 0) return;

            $content.append(`
                <div class="day-header">
                    ${day.dayName}, ${day.date}
                </div>
                <table class="schedule-table">
                    <thead>
                        <tr>
                            <th>Время</th>
                            <th>Дисциплина</th>
                            <th>Тип</th>
                            <th>Аудитория</th>
                            <th>${currentView === 'group' ? 'Преподаватель' : 'Группа'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${day.lessons.map(lesson => `
                            <tr>
                                <td class="lesson-time">${lesson.time}</td>
                                <td>
                                    <div class="lesson-name">${lesson.discipline.name}</div>
                                </td>
                                <td>${lesson.lessonType}</td>
                                <td class="lesson-room">${lesson.auditorium}</td>
                                <td>
                                    ${currentView === 'group' 
                                        ? lesson.employees.map(e => `${e.lastName} ${e.firstName[0]}.${e.middleName[0]}.`).join(', ') 
                                        : lesson.groups.map(g => g.name).join(', ')}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `);
        });
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        // Переключение между группами и преподавателями
        $('#group-view').click(function() {
            if (currentView !== 'group') {
                currentView = 'group';
                currentEntityId = null;
                $(this).addClass('active');
                $('#teacher-view').removeClass('active');
                loadEntities();
            }
        });

        $('#teacher-view').click(function() {
            if (currentView !== 'teacher') {
                currentView = 'teacher';
                currentEntityId = null;
                $(this).addClass('active');
                $('#group-view').removeClass('active');
                loadEntities();
            }
        });

        // Выбор элемента из списка
        $('#entity-list').on('click', 'li', function() {
            const entityId = $(this).data('id');
            if (currentEntityId !== entityId) {
                currentEntityId = entityId;
                $('#entity-list li').removeClass('active');
                $(this).addClass('active');
                loadSchedule();
            }
        });

        // Поиск
        $('#search-btn').click(searchEntities);
        $('#search-input').keyup(function(e) {
            if (e.key === 'Enter') {
                searchEntities();
            }
        });

        // Выбор недели
        $('#week-select').change(function() {
            currentWeek = $(this).val();
            loadSchedule();
        });
    }

    // Поиск по списку групп/преподавателей
    function searchEntities() {
        const searchTerm = $('#search-input').val().toLowerCase();
        
        if (!searchTerm) {
            filteredEntities = [...entities];
        } else {
            filteredEntities = entities.filter(entity => {
                if (currentView === 'group') {
                    return entity.name.toLowerCase().includes(searchTerm);
                } else {
                    const fullName = `${entity.lastName} ${entity.firstName} ${entity.middleName}`.toLowerCase();
                    return fullName.includes(searchTerm);
                }
            });
        }

        renderEntityList();
    }

    // Запуск приложения
    init();
});