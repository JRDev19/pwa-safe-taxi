//Verificar si el navegador soporta el service worker
if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./service-worker.js')
        .then(elm => console.log('Se registro el SW', elm))
        .catch(err => console.log('Fallo el registro', err));
}else{
    console.log('No soporta el service worker');
}