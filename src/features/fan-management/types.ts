import { Fan } from "./db/schema";

export interface FanResponse {
  data?: Fan | Fan[];
}

export interface FanManagementResult {
  data?: Fan | Fan[];
}
