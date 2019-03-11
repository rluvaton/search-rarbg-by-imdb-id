// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly'

let key;
let errorMessageSpan;

const urls = {
  api: {
    tmdb: {
      isValidApiKey: (apiKey) => `https://api.themoviedb.org/3/find/nothing?external_source=imdb_id&language=en-US&api_key=${apiKey}`,
      multiSearch: (term) => `https://api.themoviedb.org/3/search/multi?include_adult=false&page=1&query=${encodeURIComponent(term)}&language=en-US&api_key=${key}`,
      getMovieById: (movieId) => `https://api.themoviedb.org/3/movie/${movieId}?language=en-US&api_key=${key}&append_to_response=external_ids`,
      getTvShowById: (showId) => `https://api.themoviedb.org/3/tv/${showId}?language=en-US&api_key=${key}&append_to_response=external_ids`,
    }
  }
}

function sendTMDBRequest(fn, url) {
  return requestUtils.get(urls.api.tmdb.getMovieById(id), {Authorization: 'Bearer ' + accessToken})
}

function isHavingApiKey() {
  return !!localStorage.getItem('apiKey');
}

function TmdbIconClickHandlerNoApiKey() {
  updateUrl('https://developers.themoviedb.org', false, true)
}

document.body.onload = () => {
  key = localStorage.getItem('apiKey')

  if (!key) {
    let apiKeyIn = document.getElementById('apiKey');
    apiKeyIn.onkeydown = setApiKeyEvent;
    apiKeyIn.focus();

    let tmdbIcon = document.getElementById('tmdbIcon');
    tmdbIcon.onclick = TmdbIconClickHandlerNoApiKey;
  } else {
    Array.from(document.getElementsByClassName('searchApi')).forEach((item) => {
      item.className = 'searchApi';
    });

    Array.from(document.getElementsByClassName('getApi')).forEach((item) => {
      item.className = 'getApi hidden';
    });

    let tmdbIcon = document.getElementById('tmdbIcon');
    tmdbIcon.onclick = searchNameByClick;
  }
  if (!searchNameIn) {
    searchNameIn = document.getElementById('searchName');
  }

  let errorMsgLink;

  errorMsgLink = document.getElementById('tmdbUrl');

  if (errorMsgLink) {
    errorMsgLink.onclick = TmdbIconClickHandlerNoApiKey;
  }

  if (searchNameIn) {
    searchNameIn.onkeydown = searchNameKeyEvent;
    searchNameIn.focus();
  }
};

function setApiKeyEvent(event) {
  if (!isEnter(event)) {
    return true;
  }

  const apiKey = event.target.value;

  requestUtils.get(urls.api.tmdb.isValidApiKey(apiKey))
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

      if (!errorMessageSpan) {
        errorMessageSpan = document.getElementById('keyErrorMessage');
      }

      if (errorMessageSpan) {
        errorMessageSpan.className = 'hidden';
      }

      Array.from(document.getElementsByClassName('searchApi')).forEach((item) => {
          item.className = 'searchApi';
        }
      );

      Array.from(document.getElementsByClassName('getApi')).forEach((item) => {
          item.className = 'getApi hidden';
        }
      );

      let tmdbIcon = document.getElementById('tmdbIcon');
      tmdbIcon.onclick = searchNameByClick;
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

function searchNameKeyEvent(event) {
  if (isEnter(event)) {
    searchName(event.target.value);
    return false;
  }
  return true;
}

function searchNameByClick() {
  if (!searchNameIn) {
    searchNameIn = document.getElementById('searchName');
  }

  if (!searchNameIn) {
    console.error('search name input didn\'t found');
    return true;
  }

  searchName(searchNameIn.value);
  return false;
}

async function searchName(name) {
  search(await getIdByName(name));
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
  updateUrl(`/torrents.php?imdb=${imdbId}`);
}

function updateUrl(url, relative = true, newTab = false) {
  if (newTab) {
    chrome.tabs.create({url: url, active: true});
    return;
  }

  const changePageUrlCode = `window.location${relative ? '' : '.href'} = '${url}'`;

  chrome.tabs.executeScript({code: changePageUrlCode});
  window.close();
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
