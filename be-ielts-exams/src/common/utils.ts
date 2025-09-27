import crypto, { randomUUID } from "crypto";
import { diskStorage, StorageEngine } from "multer";
import configuration from "../config/configuration";

export function decryptData(b64string: string): string {
  const decodeUri = decodeURIComponent(b64string);
  return crypto
    .privateDecrypt(
      {
        key: configuration.appKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      Buffer.from(decodeUri, "base64") as any
    )
    .toString("utf8");
}

export function compareDate(
  date1: Date,
  date2: Date,
  options?: { convertTo: "second" | "minute" | "hour" | "day" }
): number {
  const timeStamp1 = date1.getTime();
  const timeStamp2 = date2.getTime();
  const delta = timeStamp1 - timeStamp2;
  const convertDictionary = {
    second: 1000,
    minute: 1000 * 60,
    hour: 1000 * 60 * 60,
    day: 1000 * 60 * 60 * 24
  };
  return delta / convertDictionary[options?.convertTo || "second"];
}

export function timeStampToDate(timeStamp: number): Date {
  return new Date(timeStamp * (timeStamp < 1e12 ? 1000 : 1));
}

export const removeEndTrailingSlash = (url: string) => {
  return url.endsWith("/") ? url.slice(0, -1) : url;
};
export const removeStartTrailingSlash = (url: string) => {
  return url.startsWith("/") ? url.slice(1) : url;
};

export const defaultUploadStorage: StorageEngine = diskStorage({
  destination: configuration.uploadPath,
  filename(req: any, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) {
    const newName = `${new Date().getTime()}-${randomUUID()}-${encodeURIComponent(file.originalname).slice(-32)}`;
    callback(null, newName);
  }
});

export const sortQueryToObject = (sortString: string) => {
  if (!sortString) return [];
  const sorts = sortString.split(",");
  const result = [];
  for (const sort of sorts) {
    const [field, type] = sort.split(":");
    result.push({
      [field]: type || "asc"
    });
  }
  return result;
};

interface IRandomStringProps {
  length?: number;
}

export const randomString = (options?: IRandomStringProps): string => {
  let result = `${randomUUID()}`.replace(/-/gi, "");

  if (options?.length) {
    result = result.slice(0, options?.length);
  }

  return result;
};

export const getDuplicateValue = (
  callbackGetValue: (item: any) => string | number | null | undefined,
  collections: Array<any>
) => {
  const dictionary = {};

  for (const item of collections) {
    const value = callbackGetValue(item);
    dictionary[value] = dictionary[value] ? dictionary[value] + 1 : 1;
    if (dictionary[value] >= 2) {
      return value;
    }
  }

  return null;
};

export function isDateString(value: any) {
  return !!Date.parse(value);
}
export function isNumber(value: any) {
  return typeof value === "number";
}

export function isEquals(valueRecord: any, valueBody: any) {
  if (isNumber(valueRecord) || isNumber(valueBody)) {
    return valueRecord == valueBody;
  }
  if (isDateString(valueRecord) && isDateString(valueBody)) {
    return new Date(valueBody).toDateString() == new Date(valueRecord).toDateString();
  }
  return valueRecord == valueBody;
}
