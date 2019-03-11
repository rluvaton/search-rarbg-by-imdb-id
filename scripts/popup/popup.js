// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly'

import * as requestUtils from './http-request-utils';

let key;
let errorMessageSpan;

const urls = {
  api: {
    tmdb: {
      search: (term) => `https://api.themoviedb.org/3/find/${term}?external_source=imdb_id&language=en-US&api_key=${key}`,
      multiSearch: (term) => `https://api.themoviedb.org/3/search/multi?include_adult=false&page=1&query=${encodeURIComponent(term)}&language=en-US&api_key=${key}`,
      getMovieById: (movieId) => `https://api.themoviedb.org/3/movie/${movieId}?language=en-US&api_key=${key}&append_to_response=external_ids`,
      getTvShowById: (showId) => `https://api.themoviedb.org/3/tv/${showId}?language=en-US&api_key=${key}&append_to_response=external_ids`,
    }
  }
}

document.body.onload = () => {
  key = localStorage.getItem('apiKey')

  if (!key) {
    let apiKeyIn = document.getElementById('apiKey');
    apiKeyIn.onkeydown = setApiKeyEvent;
    apiKeyIn.focus();
  } else {
    Array.from(document.getElementsByClassName('searchApi')).forEach((item) => {
        item.className = 'searchApi';
      }
    );

    Array.from(document.getElementsByClassName('getApi')).forEach((item) => {
        item.className = 'getApi hidden';
      }
    );
  }
  if (!searchNameIn) {
    searchNameIn = document.getElementById('searchName');
  }

  if (searchNameIn) {
    searchNameIn.onkeydown = searchNameKeyEvent;
    searchNameIn.focus();
  }
}
;

function setApiKeyEvent(event) {
  if (!isEnter(event)) {
    return true;
  }

  const apiKey = event.target.value;

  requestUtils.get(urls.api.tmdb.search('nothing'))
    .then((res) => {
      if (res.status_code === 7) {
        throw {
          message: 'states code is 7',
          error: res
        };
      }
    })
    .then(() => {
      console.log('Setting the api key...');

      localStorage.setItem('apiKey', apiKey);
      key = apiKey;

      errorMessageSpan.className = 'hidden';

      Array.from(document.getElementsByClassName('searchApi')).forEach((item) => {
          item.className = 'searchApi';
        }
      );

      Array.from(document.getElementsByClassName('getApi')).forEach((item) => {
          item.className = 'getApi hidden';
        }
      );
    })
    .catch((error) => {
      console.error(error);
      if (!errorMessageSpan) {
        errorMessageSpan = document.getElementById('keyErrorMessage');
      }

      if (!errorMessageSpan) {
        console.error('no element with id keyErrorMessage');
        return;
      }

      errorMessageSpan.className = '';
    });

  return false;
}

// TODO - Set the input to be in focus

// TODO - Check why the console.log not showing in the DevTools
console.log(`Init`);

// TODO - Check why this function not get called
async function searchNameKeyEvent(event) {

  if (isEnter(event)) {
    search(await getIdByName(event.target.value));
    return false;
  }

  return true;
}

function getIdByName(name) {
  return requestUtils.get(urls.api.tmdb.multiSearch(name))
    .then(parseResults)
    .catch((error) => {
      console.error(error);
      return null;
    });
}

let searchIn = document.getElementById('searchinput');
let searchBtn = getSearchBtn();
let searchNameIn = document.getElementById('searchName');

function search(imdbId) {

  // opens a communication between scripts
  var port = chrome.runtime.connect();

  // sends a message throw the communication port
  port.postMessage({
    'from': 'popup',
    'url': `/torrents.php?imdb=${imdbId}`,
    // window.location = '/torrents.php?imdb=tt4016466';
    'relative': true
  });
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

    obj.results.find(async (item) => {
      if (item.media_type !== 'tv' && item.media_type !== 'movie') {
        return false;
      }

      id = await ((item.media_type === 'tv') ? getTVIMDBID(item.id, item.original_title) : getMovieIMDBID(item.id, item.original_title))

      if (id) {
        resolve(id);
        return true;
      }

    });

    return id;
  });

}

function getMovieIMDBID(id, title) {
  return requestUtils.get(urls.api.tmdb.getMovieById(id))
    .then((resObj) => {
      let imdbID = null;

      if (resObj && ((resObj.imdb_id && resObj.imdb_id.length !== 0) || (resObj.external_ids && resObj.external_ids.imdb_id && resObj.external_ids.imdb_id.length > 0)) && resObj.original_title === title) {
        imdbID = (resObj.imdb_id && resObj.imdb_id.length !== 0) ? resObj.imdb_id : resObj.external_ids.imdb_id;
      }

      return imdbID;
    })
    .catch((error) => {
      console.error(error);
      return null;
    });
}

function getTVIMDBID(id, title) {
  return requestUtils.get(urls.api.tmdb.getTvShowById(id))
    .then((resObj) => {
      var imdbID = null;

      if (resObj && ((resObj.imdb_id && resObj.imdb_id.length !== 0) || (resObj.external_ids && resObj.external_ids.imdb_id && resObj.external_ids.imdb_id.length > 0)) && resObj.original_title === title) {
        imdbID = (resObj.imdb_id && resObj.imdb_id.length !== 0) ? resObj.imdb_id : resObj.external_ids.imdb_id;
      }

      return imdbID;
    })
    .catch((error) => {
      console.error(error);
      return null;
    });
}

function isEnter(event) {
  return event && (event.which == 13 || event.keyCode == 13);
}
