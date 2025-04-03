// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Кэш для хранения данных
let cache = {
    groups: null,
    teachers: null,
    schedule: {}
};

// Получение списка групп
app.get('/api/groups', async (req, res) => {
    try {
        if (!cache.groups) {
            const response = await axios.get('https://ssau.ru/rasp/api/v1/groups');
            cache.groups = response.data;
        }
        res.json(cache.groups);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

// Получение списка преподавателей
app.get('/api/teachers', async (req, res) => {
    try {
        if (!cache.teachers) {
            const response = await axios.get('https://ssau.ru/rasp/api/v1/employees');
            cache.teachers = response.data;
        }
        res.json(cache.teachers);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ error: 'Failed to fetch teachers' });
    }
});

// Получение расписания для группы
app.get('/api/schedule/group/:groupId', async (req, res) => {
    const { groupId } = req.params;
    const { week } = req.query;

    try {
        if (!cache.schedule[groupId] || week) {
            const url = `https://ssau.ru/rasp/api/v1/group/${groupId}?week=${week || ''}`;
            const response = await axios.get(url);
            cache.schedule[groupId] = response.data;
        }
        res.json(cache.schedule[groupId]);
    } catch (error) {
        console.error('Error fetching group schedule:', error);
        res.status(500).json({ error: 'Failed to fetch group schedule' });
    }
});

// Получение расписания для преподавателя
app.get('/api/schedule/teacher/:teacherId', async (req, res) => {
    const { teacherId } = req.params;
    const { week } = req.query;

    try {
        const url = `https://ssau.ru/rasp/api/v1/employee/${teacherId}?week=${week || ''}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching teacher schedule:', error);
        res.status(500).json({ error: 'Failed to fetch teacher schedule' });
    }
});

// Получение текущей учебной недели
app.get('/api/current-week', async (req, res) => {
    try {
        const response = await axios.get('https://ssau.ru/rasp/api/v1/week');
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching current week:', error);
        res.status(500).json({ error: 'Failed to fetch current week' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});