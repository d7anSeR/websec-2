import json
import codecs
import requests
from bs4 import BeautifulSoup


def parser():
    result = {"teachers": []}
    groups = []
    teachers = []
    for i in range(1, 122):
        url = "https://ssau.ru/staff?page=" + str(i)
        response = requests.get(url)
        teachers.append(response.text)
        if i == 121:
            for teacher in teachers:
                soup = BeautifulSoup(teacher, 'html.parser')
                teachers_list = soup.select(".list-group-item > a")
                for t in teachers_list:
                    staffId = ''.join(filter(str.isdigit, t.get("href")))
                    result["teachers"].append({"name": t.text, "link": f"/rasp?staffId={staffId}"})
    
    for i in range(1, 6):
        url = "https://ssau.ru/rasp/faculty/492430598?course=" + str(i)
        response = requests.get(url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            group_list = soup.select(".group-catalog__groups > a")

            for group in group_list:
                group_name = group.text
                group_link = "/rasp" + group['href'][group['href'].find('?'):]

                groups.append({"name": group_name, "link": group_link})
                result["groups"] = groups
    with codecs.open("groupAndTeachers.json", "w", "utf-8") as stream:
        stream.write(json.dumps(result, ensure_ascii=False))
    stream.close()


parser()