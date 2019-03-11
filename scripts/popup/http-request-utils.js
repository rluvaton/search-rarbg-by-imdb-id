function sendRequest(method, url, jsonBody, responseAsJson = true) {
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

    xhr.send(JSON.stringify(jsonBody || {}));
  });
}

const requestUtils = {
  send: sendRequest,
  get: (url, responseAsJson = true) => sendRequest('GET', url, {}, responseAsJson),
  post: (url, body, responseAsJson = true) => sendRequest('POST', url, body, responseAsJson),
  put: (url, body, responseAsJson = true) => sendRequest('PUT', url, body, responseAsJson),
  delete: (url, body, responseAsJson = true) => sendRequest('DELETE', url, body, responseAsJson),
};

module.exports = requestUtils;
