let PORT = process.env.PORT || 5500;
let XMLHttpRequest = require('xhr2');
const HTMLParser = require('node-html-parser');
const bp = require('body-parser');
const fs = require("fs");
let http = require('http');
let path = require('path');
let express = require('express');
let app = express();
const server = http.Server(app);


app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.get('/', function(req, res) {
    response.sendFile(path.join(__dirname, 'index.html'));
});
server.listen(PORT, () => {
    console.log('Listening on 5500');
});

app.get('/rasp', (req, res) => {
    let request = new XMLHttpRequest();
    let url = "https://ssau.ru" + req.url;
    request.open("GET", url, true);
    request.send(null);
    request.onreadystatechange = () => {
        if (request.readyState == 4) {
            let schedule = {
                date: [],
                daySchedule: [],
                time: [],
                currentWeek: 1,
                selectedGroup: ''
            };
            let html = HTMLParser.parse(request.responseText);

            for (let cell of html.querySelectorAll(".schedule__item")) {
                if (cell.querySelector(".schedule__discipline")) {
                    let cellGroups = [];
                    if (!!cell.querySelectorAll(".schedule__group").length) {
                        for (let group of cell.querySelectorAll(".schedule__group")) {
                            if (group.innerText.trim() !== "") {
                                cellGroups.push(JSON.stringify({
                                    name: group.innerText,
                                    link: group.getAttribute("href") ?? null
                                }))
                            } else {
                                cellGroups.push(JSON.stringify({
                                    name: "",
                                    link: null
                                }))
                            }
                        }
                    } 
                    schedule.daySchedule.push({
                        subject: cell.querySelector(".schedule__discipline").innerText,
                        place: cell.querySelector(".schedule__place").innerText,
                        teacher: JSON.stringify(cell.querySelector(".schedule__teacher > .caption-text") === null ?
                            {
                                name: "",
                                link: null,
                            } :
                            {
                                name: cell.querySelector(".schedule__teacher > .caption-text") ? cell.querySelector(".schedule__teacher > .caption-text").innerText : "",
                                link: cell.querySelector(".schedule__teacher > .caption-text").getAttribute("href")
                            }),
                        groups: cellGroups
                    })
                } else if (!!html.querySelectorAll(".schedule__item + .schedule__head").length && !schedule.date.length) {
                    for (let cell of html.querySelectorAll(".schedule__item + .schedule__head")) {
                        schedule.date.push(cell.childNodes[0].innerText + cell.childNodes[1].innerText)
                    }
                } else {
                    schedule.daySchedule.push({
                        subject: null
                    })
                }
            }
            for (let cell of html.querySelectorAll(".schedule__time")) {
                schedule.time.push(cell.childNodes[0].innerText + cell.childNodes[1].innerText);
            }
            schedule.selectedGroup = html.querySelector(".info-block__title")?.innerText;
            schedule.currentWeek = html.querySelector(".week-nav-current_week")?.innerText;
            schedule.daySchedule = schedule.daySchedule.slice(6, schedule.daySchedule.length);
            res.send(JSON.stringify(schedule));
        }
    };
})

app.get('/groupsAndTeachers', (req, res) => res.sendFile(path.join(__dirname, 'groupAndTeachers.json')))