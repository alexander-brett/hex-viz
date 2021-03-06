function loadUrl(url){
  return new Promise(function(resolve, reject){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {resolve(xhr.response);};
    xhr.send();
  });
}

function loadDatabase(response){
  var uInt8Array = new Uint8Array(response);
  return new SQL.Database(uInt8Array);
};
