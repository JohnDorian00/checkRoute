// Получить коорлинаты точки по адресу
// формат address - "улица+дом+город"
export async function getGeoCoordinates(address) {
    address.replace(/ /g, '+');
    return new Promise((resolve, reject)=>{
        fetch('https://geocode-maps.yandex.ru/1.x/?format=json&apikey=37f48201-837b-4885-9dd9-08c6a5ed9b24&geocode=' + (address || 0))
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                let coord = null;

                if (data.response.GeoObjectCollection.featureMember.length > 0) {
                    coord = data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos;
                }

                if (coord) {
                    coord = coord.split(" ");
                    coord = [coord[1], coord[0]]
                    $("#coord").text(coord);
                    resolve(coord);
                } else {
                    reject(address);
                }
            });
    })
}

// Создать html код элемента списка
export function createItemsHtml(points) {
    let htmlCode = "";

    points.forEach((item) => {

        try {
            htmlCode += createItemHtml(item);
        } catch (e) {
            console.error("Ошибка составления html кода списка: ", e)
        }
    })

    return htmlCode

    function createItemHtml(item) {
        if (!item.data) item.data = "Неизвестно";
        item.pointsAmount = item.arr.length;

        if (item.id === 0) return '<a style="cursor: pointer" id="elem' + item.id + '" class="list-group-item list-group-item-action" aria-current="true"><h5 class="mb-1"> - </h5><small>Показать только точки базы</small></a>\n'

        if (item.id !== 0 && !item.id) throw "отсутствует id у записи в routePoints";

        return '<a style="cursor: pointer" id="elem' + item.id + '" class="list-group-item list-group-item-action" aria-current="true"><h5 class="mb-1">' + item.data +'</h5><small> Количество точек: ' + (item.pointsAmount).toString() + '</small></a>\n'
    }
}