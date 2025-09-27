const fs = require("fs");
const crypto = require("crypto");

const b64string = "UsQ5erBwkarirrAIEB7kY3eOxA1P9k8hxwFk99OYspyz2hVBkSQ6fxnXWhBBN0vv87Fm9t+U/5K39Y4mOTNl4bb2Mp2L09Am7cIktttugeF4TzuEoQLCl56k1WZwTVijc/qMRGb8G2QZEj/txvZnkC47bAof0YUfViIUpB5E09Y=";

function decryptData(b64string) {
  const decodeUri = decodeURIComponent(b64string);
  return crypto
    .privateDecrypt(
      {
        key: fs.readFileSync("key.pem"),
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      Buffer.from(decodeUri, "base64")
    )
    .toString("utf8");
}

console.log(decryptData(b64string));
