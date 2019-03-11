function sendRequest(method, url, jsonBody, headers, responseAsJson = true) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
      if (this.readyState !== this.DONE) {
        return;
      }

      if (!xhr || !xhr.responseText) {
        reject({
          message: 'XMLHttpRequest or response text is null',
          xhr: xhr,
          responseText: xhr ? xhr.responseText : 'XMLHttpRequest is null, so no responseText'
        })
        return;
      }

      const responseText = xhr.responseText;

      if (!responseAsJson) {
        resolve(responseText);
        return;
      }
      let jsonRes;

      try {
        jsonRes = JSON.parse(responseText);
      } catch (ex) {
        reject({
          xhr: xhr,
          xhrResponseText: responseText,
          err: ex
        });
        return;
      }

      resolve(jsonRes);
    });

    xhr.open(method, url);

    if (headers) {
      Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value))
    }

    xhr.send(JSON.stringify(jsonBody || {}));
  });
}

const requestUtils = {
  send: sendRequest,
  get: (url, headers = {}, responseAsJson = true) => sendRequest('GET', url, {}, headers, responseAsJson),
  post: (url, body, headers = {}, responseAsJson = true) => sendRequest('POST', url, body, headers, responseAsJson),
  put: (url, body, headers = {}, responseAsJson = true) => sendRequest('PUT', url, body, headers, responseAsJson),
  delete: (url, body, headers = {}, responseAsJson = true) => sendRequest('DELETE', url, body, headers, responseAsJson),
};
