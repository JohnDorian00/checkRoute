export function handleFile(e) {
    return new Promise((resolve, reject)=>{
        let files = e.target.files, f = files[0];
        let reader = new FileReader();
        reader.onload = function(e) {
            let d = new Uint8Array(e.target.result);
            let workbook = XLSX.read(d, {type: 'array'});
            resolve(XLSX.utils.sheet_to_json(workbook.Sheets['Лист1']));
        };
        reader.readAsArrayBuffer(f);
    })
}
