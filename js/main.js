import {getGeoCoordinates, createItemsHtml} from "./func.js";
import {handleFile} from "./excel.js";

let myMap, objectManagerBase, objectManagerRoute, idList = [],
    baseAddresses = [], routeAddresses = [];


// Jquery
let excelBaseUploadButton = $("#excelBaseUploadButton"),
    excelRouteUploadButton = $("#excelRouteUploadButton"),
    list = $("#list");

// Дождёмся загрузки API и готовности DOM.
ymaps.ready(initMap);

// Загрузка экселя с точками базы и их отрисовка на карте
excelBaseUploadButton.change(async (e)=>{
    clearBasePoints();

    let tmp = await handleFile(e) || [];

    for (const t of tmp) {
        let address, coord;
        try {
            if (t["Город"]) {
                address = t["Адрес"] + " " + t["Город"];
            } else {
                address = t["Адрес"];
            }
            coord = await getGeoCoordinates(address);
        } catch (e) {
            console.warn("Координаты для адреса \"" + address + "\" не найдены");
        }
        baseAddresses.push({"address" : address, "coord": coord})
    }
    tmp = undefined;

    addPointsToMap(baseAddresses, "base");

    console.log("Добавлены адреса базы: ", baseAddresses)
})

// Загрузка экселя с точками маршрута, их отрисовка на карте и вывод списка дней
excelRouteUploadButton.change(async (e)=>{
    clearRoutePoints();

    routeAddresses = await groupOfData(await handleFile(e) || []);

    if (routeAddresses.length < 1) return

    let htmlCode = createItemsHtml(routeAddresses);
    list.append(htmlCode);

    for (let i = 0; i < routeAddresses.length; i++) {
        $("#elem" + i).click(() => {
            applyRouteDay(i);
        })
    }

    applyRouteDay(1);

    console.log("Добавлены адреса маршрута : ", routeAddresses)
})

// Запуск авторасчёта совпадения точек маршрута и базы
// $("#startButton").click(async ()=>{
//     let points = []
//     try {
//         for (const address of addresses) {
//             points.push({
//                 "address" : address,
//                 "coord": await getGeoCoordinates(address)
//             })
//         }
//         addPointsToMap(points, "base");
//     } catch (address) {
//         console.warn("Координаты для адреса \"" + address + "\" не найдены")
//     }
// })

// Очистка карты, экселей, внутренних переменных
$("#clearButton").click(async ()=>{
    clearAllPoints();
})

// Группировка данных по датам
async function groupOfData(arr) {
    return new Promise(async (resolve, reject)=>{
        let tmp = [];

        arr[1] = arr[15];

        for (const t of arr) {
            let address, coord, data;
            try {
                data = new Date(1900,0,0);
                data.setDate(data.getDate() + parseInt(t["Дата"]) - 1);
                data = data.toLocaleDateString();

                if (t["Город"]) {
                    address = t["Адрес"] + " " + t["Город"];
                } else {
                    address = t["Адрес"];
                }

                coord = await getGeoCoordinates(address);
            } catch (e) {
                console.warn("Координаты для адреса \"" + address + "\" не найдены");
            }
            tmp.push({"data": data, "address" : address, "coord": coord});
        }

        tmp.sort((a,b)=>{
            if ( a.data < b.data ){
                return -1;
            }
            if ( a.data > b.data ){
                return 1;
            }
            return 0;
        })

        tmp = sortData(tmp);
        tmp.unshift({id: 0, arr: []})

        resolve(tmp);
    })

    function sortData(data) {
        let sortedData = [], dates = new Set(), id = 0;

        for (const d of data) {
            dates.add(d.data);
        }

        for (const day of dates) {
            sortedData.push({"id": id + 1, "data": day, arr: []});

            for (const d of data) {
                if (d.data === day) {
                    sortedData[id].arr.push(d);
                }
            }
            id++;
        }
        id = undefined;

        return sortedData;
    }
}

// Применить точки маршрута на карту
function applyRouteDay(id) {
    objectManagerRoute.removeAll();
    addPointsToMap(routeAddresses[id].arr, "route");

    for (let i = 0; i < routeAddresses.length; i++) {
        $("#elem" + i).removeClass("active")
    }

    $("#elem" + id).addClass("active")

    console.log(routeAddresses[id])
}

// Инициализация карты
function initMap() {
    // Создание экземпляра карты и его привязка к контейнеру с
    // заданным id ("map").
    myMap = new ymaps.Map('map', {
        // При инициализации карты обязательно нужно указать
        // её центр и коэффициент масштабирования.
        center: [55.76, 37.64], // Москва
        zoom: 10
    }, {
        searchControlProvider: 'yandex#search'
    });
    objectManagerBase = new ymaps.ObjectManager({});
    objectManagerRoute = new ymaps.ObjectManager({});

    // islands#greenDotIcon; islands#redDotIcon; islands#blueDotIcon
    objectManagerBase.objects.options.set('preset', 'islands#blueDotIcon');
    objectManagerRoute.objects.options.set('preset', 'islands#redDotIcon');

    myMap.geoObjects.add(objectManagerBase);
    myMap.geoObjects.add(objectManagerRoute);
}

// Очистка карты
function clearAllPoints() {
    clearBasePoints();
    clearRoutePoints();
    excelBaseUploadButton.val("");
    excelRouteUploadButton.val("");
}

// Очистка точек базы
function clearBasePoints() {
    baseAddresses = [];
    objectManagerBase.removeAll();
}

// Очистка точек маршрута
function clearRoutePoints() {
    for (let i = 0; i < routeAddresses.length; i++) {
        $("#elem" + i).off("click");
    }
    list.empty();
    routeAddresses = [];
    objectManagerRoute.removeAll();
}

// Добавить точки на карту, формат:
// points = [ {"address" : "озёрная д. 9 москва", "coord": [55.831903, 37.411961]} ]
function addPointsToMap(points, type) {
    if (!points || !Array.isArray(points) || points.length === 0) return console.warn("Нет данных для добавления на карту")

    let id, objectManager;

    if (idList.length === 0) {
        id = 0;
    } else {
        id = idList[idList.length - 1] + 1;
    }

    if (type === "base") {
        objectManager = objectManagerBase;
    } else if (type === "route") {
        objectManager = objectManagerRoute;
    } else {
        return console.warn("Не выбран тип точек")
    }

    let json = {
        "type": "FeatureCollection",
        "features": []
    }

    points.forEach((item) => {
        //    item = {"address" : "озёрная д. 9 москва", "coord": [55.831903, 37.411961]}
        json.features.push({
            "type": "Feature",
            "id": id,
            "geometry":
                {
                    "type": "Point",
                    "coordinates": item.coord
                },
            "properties": {
                "balloonContentHeader": "",
                "balloonContentBody": item.address,
                "balloonContentFooter": "",
                "hintContent": item.address
            }
        })
        idList.push(id++);
    })

    if (json.features.length > 0) {
        objectManager.add(json);
    }
}
