import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Set default timezone to Vietnam
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

export const dateUtil = dayjs;

export const now = () => dayjs().tz();

export const formatDate = (date: string | Date | dayjs.Dayjs, format = "YYYY-MM-DD HH:mm:ss") => {
  return dayjs(date).tz().format(format);
};

export const startOfDay = (date?: string | Date | dayjs.Dayjs) => {
  return dayjs(date).tz().startOf("day");
};

export const endOfDay = (date?: string | Date | dayjs.Dayjs) => {
  return dayjs(date).tz().endOf("day");
};
