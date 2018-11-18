// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly'

let key;
let errorMessageSpan;
document.body.onload = () => {


  key = localStorage.getItem('apiKey')

  if(!key) {
    let apiKeyIn = document.getElementById('apiKey');
    apiKeyIn.onkeydown = setApiKeyEvent;
  } else {
    Array.from(document.getElementsByClassName('searchApi')).forEach((item) => {
      item.className = 'searchApi';
    });

    Array.from(document.getElementsByClassName('getApi')).forEach((item) => {
      item.className = 'getApi hidden';
    });
  }
  if (!searchNameIn) {
    searchNameIn = document.getElementById('searchName');
  }

  if (searchNameIn) {
    searchNameIn.onkeydown = searchNameKeyEvent;
  }
};

function setApiKeyEvent(event) {

  if (event.which == 13 || event.keyCode == 13) {
new Promise((resolve, reject) => {

  var data = "{}";

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    var res = JSON.parse(xhr.responseText);
    console.log(res);
    if(res.status_code === 7) {
      reject({});
      return;
    }
    resolve(event.target.value);
  }
});
xhr.onerror = function () {
    reject(xhr.status);
  };


xhr.open("GET", "https://api.themoviedb.org/3/find/ax?external_source=imdb_id&language=en-US&api_key=" + event.target.value);

xhr.send(data);
  })
  .then((_key) => {
    localStorage.setItem('apiKey', _key);
    key = _key;

    if(!errorMessageSpan) {

    let errorMessageSpan = document.getElementById('keyErrorMessage'); 
    }

    if(!errorMessageSpan) {
      console.error(error);
      return;
    }
    errorMessageSpan.className = 'hidden';


    Array.from(document.getElementsByClassName('searchApi')).forEach((item) => {
      item.className = 'searchApi';
    });

    Array.from(document.getElementsByClassName('getApi')).forEach((item) => {
      item.className = 'getApi hidden';
    });
  })
  .catch((error) => {
    if(!errorMessageSpan) {

    let errorMessageSpan = document.getElementById('keyErrorMessage'); 
    }

    if(!errorMessageSpan) {
      console.error(error);
      return;
    }
    errorMessageSpan.className = '';
  });

    return false;
  }

  return true;

}

// TODO - Set the input to be in focus

// TODO - Check why the console.log not showing in the DevTools
console.log(`'Allo 'Allo! Popup`);


// TODO - Check why this function not get called
async function searchNameKeyEvent(event) {

  if (event.which == 13 || event.keyCode == 13) {

    let name = search(await getIdByName(event.target.value));

    return false;
  }

  return true;
}

function getIdByName(name) {

  return new Promise((resolve, reject) => {
    // TODO - search here the IMDB ID by name 
    var data = "{}";

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", () => {
      if (this.readyState === this.DONE) {

        try {
          let res = JSON.parse(xhr.responseText);

          parseResults(res)
            .then(resolve);
        } catch (ex) {
          console.log(ex);
        }
      }
    });

    xhr.open("GET", `https://api.themoviedb.org/3/search/multi?include_adult=false&page=1&query=${encodeURIComponent(name)}&language=en-US&api_key=` + key);

    xhr.send(data);
  });

}


let searchIn = document.getElementById('searchinput');
let searchBtn = getSearchBtn();
let searchNameIn = document.getElementById('searchName');


function search(str) {

  // opens a communication between scripts
  var port = chrome.runtime.connect();

  let code = `

  		function getSearchBtn() {
  let div = document.getElementById('searchTorrent');
  if (!div) {
    return null;
  }

  let buttons = div.getElementsByTagName('button');

  if (!buttons || buttons.length === 0) {
    return null;
  }

  return buttons[0];
}

  		function run(){
  			let searchIn;
        if(!searchIn) {
		searchIn = document.getElementById('searchinput');
		
		if(!searchIn) {
			console.warn('No search input founded')
			return null;
		}
	}
	let searchBtn;

	if(!searchBtn) {
		searchBtn = getSearchBtn()
		
		if(!searchBtn) {
			console.warn('No search Button founded')
			return null;
		}
	}

	searchIn.value = '${str}';
	searchBtn.click();}
	run();
	`;

  // sends a message throw the communication port
  port.postMessage({
    'from': 'popup',
    'code': code
  });

  // if(!searchIn) {
  // 	searchIn = document.getElementById('searchinput');

  // 	if(!searchIn) {
  // 		console.warn('No search input founded')
  // 		return null;
  // 	}
  // }

  // if(!searchBtn) {
  // 	searchBtn = getSearchBtn();

  // 	if(!searchBtn) {
  // 		console.warn('No search Button founded')
  // 		return null;
  // 	}
  // }

  // searchIn.value = str;
  // searchBtn.click();
}

function getSearchBtn() {
  let div = document.getElementById('searchTorrent');
  if (!div) {
    return null;
  }

  let buttons = div.getElementsByTagName('button');

  if (!buttons || buttons.length === 0) {
    return null;
  }

  return buttons[0];
}



function parseResults(obj) {

  return new Promise((resolve, reject) => {
    if (!obj || obj.total_results === 0 || !obj.results || !Array.isArray(obj.results) || obj.results.length === 0) {
      return null;
    }

    let id = null

    var firstItem = obj.results.find(async (item) => {
      if (item.media_type !== 'tv' && item.media_type !== 'movie') {
        return false;
      }

      id = await ((item.media_type === 'tv') ? getTVIMDBID(item.id, item.original_title) : getMovieIMDBID(item.id, item.original_title))

      if (id) {
        resolve(id);
      }

    });

    return id;
  });

}

function getMovieIMDBID(id, title) {

  return new Promise((resolve, reject) => {
    var data = "{}";

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
      if (this.readyState === this.DONE) {
        var resObj = JSON.parse(xhr.responseText);
        var imdbID = null;

        if (resObj && ((resObj.imdb_id && resObj.imdb_id.length !== 0) || (resObj.external_ids && resObj.external_ids.imdb_id && resObj.external_ids.imdb_id.length > 0)) && resObj.original_title === title) {
          imdbID = (resObj.imdb_id && resObj.imdb_id.length !== 0) ? resObj.imdb_id : resObj.external_ids.imdb_id;
        }

        resolve(imdbID);
      }
    });

    xhr.open("GET", "https://api.themoviedb.org/3/movie/%7Bmovie_id%7D?language=en-US&api_key=" + key + "&append_to_response=external_ids");

    xhr.send(data);
  });
}


function getTVIMDBID(id, title) {



  return new Promise((resolve, reject) => {
    var data = "{}";

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
      if (this.readyState === this.DONE) {
        var resObj = JSON.parse(xhr.responseText);
        var imdbID = null;

        if (resObj && ((resObj.imdb_id && resObj.imdb_id.length !== 0) || (resObj.external_ids && resObj.external_ids.imdb_id && resObj.external_ids.imdb_id.length > 0)) && resObj.original_title === title) {
          imdbID = (resObj.imdb_id && resObj.imdb_id.length !== 0) ? resObj.imdb_id : resObj.external_ids.imdb_id;
        }

        resolve(imdbID);
      }
    });

    xhr.open("GET", `https://api.themoviedb.org/3/tv/${id}?language=en-US&api_key=${key}&append_to_response=external_ids`);

    xhr.send(data);
  });
}
