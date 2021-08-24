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
