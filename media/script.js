let url = '/rasp?groupId=531030143';
let week;

function changeWeek(flag) {
    let count = url.indexOf("&");
    if (count !== -1) {
        url = url.slice(0, count);
    }
    if (flag) { url += "&selectedWeek="+ (week + 1)}
    else { url += "&selectedWeek="+ (week - 1)}
    updateData(url);
}

function updateData(currentUrl) {
    url = currentUrl;
    fetch(currentUrl)
        .then((data) => data.json()).then((res) => {
            generateSchedule(res);
            console.log(res);
            week = parseInt(res.currentWeek);
        })
}

fetch('/groupsAndTeachers')
    .then((data) => data.json())
    .then((res) => {

        let stringsGroup = document.querySelector("#group");
        for (let group of res.groups) {
            let elementGroup = document.createElement("option");
            elementGroup.innerHTML = group.name;
            elementGroup.setAttribute("value", group.link);
            stringsGroup.appendChild(elementGroup);
        }
        stringsGroup.addEventListener("change", () => {
            updateData(stringsGroup.value);
            document.querySelector(".selected").innerHTML = res.groups.find((a) => a.link === stringsGroup.value).name;
            stringsGroup.value = "Group";
        })

        let stringsTeacher = document.querySelector("#teacher");
        for (let teacher of res.teachers) {
            let elementTeacher = document.createElement("option");
            elementTeacher.innerHTML = teacher.name;
            elementTeacher.setAttribute("value", teacher.link);
            stringsTeacher.appendChild(elementTeacher);
        }
        stringsTeacher.addEventListener("change", () => {
            updateData(stringsTeacher.value);
            document.querySelector(".selected").innerHTML = res.teachers.find((a) => a.link === stringsTeacher.value).name;
            stringsTeacher.value = "Teacher";
        })
    })

function generateSchedule(data) {
    let table = document.querySelector("#scheduleBody");
    for (let child of table.childNodes) {
        table.removeChild(child);
    }
    let header = table.insertRow();
    header.insertCell().appendChild(document.createTextNode("Время"));
    header.classList.add("tableHead");
    let count = 0;
    for (let headCell of data.date) {
        let cell = header.insertCell();
        cell.classList.add(`column${count}`);
        count++;
        cell.appendChild(document.createTextNode(headCell.replace(/\./g, '').replace(/\d/g, '')));
        cell.appendChild(document.createElement("br"));
        cell.appendChild(document.createTextNode(headCell.replace(/[^.\d]/g, '')));
    }
    for (let i = 0; i < data.time.length; i++) {
        let row = table.insertRow();
        let timeCell = row.insertCell();
        timeCell.appendChild(document.createTextNode(data.time[i].substr(0, 6)));
        timeCell.appendChild(document.createElement("br"));
        timeCell.appendChild(document.createTextNode(data.time[i].substr(6)));
        for (let j = 0; j < 6; j++) {
            let cell = row.insertCell();
            cell.classList.add(`column${j}`);
            if (data.daySchedule[j].subject === null) {
                continue;
            }
            let cellData = data.daySchedule[j];
            cell.appendChild(document.createTextNode(cellData.subject));
            cell.appendChild(document.createElement("br"));
            cell.appendChild(document.createTextNode(cellData.place));
            cell.appendChild(document.createElement("br"));
            let parsedGroupsAndTeachers = cellData.groups;
            parsedGroupsAndTeachers.push(cellData.teacher);
            for (let groupOrTeacher of parsedGroupsAndTeachers) {
                let groupOrTeacherInfo = JSON.parse(groupOrTeacher);
                if (groupOrTeacherInfo.link === null) {
                    continue;
                }
                let links = document.createElement("a");
                links.innerHTML = groupOrTeacherInfo.name;
                links.addEventListener("click", () => updateData(groupOrTeacherInfo.link));
                links.classList.add("groupLink");
                cell.appendChild(links);
                cell.appendChild(document.createElement("br"));
            }
        }
        data.daySchedule = data.daySchedule.slice(data.daySchedule.length >= 6 ? 6 : data.daySchedule.length);
        let head = document.getElementById('selected');
        head.innerHTML = data.selectedGroup;
    }
}

updateData(url);
