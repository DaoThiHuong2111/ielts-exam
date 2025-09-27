import { constants, publicEncrypt } from "crypto";
import { readFileSync } from "fs";

const appBundleName = "com.ekyc.demo";
const timestamp = "1656571479476";
const appLicenceKey = "license012301203120";
const appId = "serviceID01203102";

const string = [appBundleName, timestamp, appLicenceKey, appId].join(",");

const key = publicEncrypt(
  {
    key: readFileSync("key.public.pem"),
    padding: constants.RSA_PKCS1_PADDING
  },
  Buffer.from(string)
).toString("base64");

console.log(key);
