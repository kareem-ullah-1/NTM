import { apiRequest } from "./client";

export type City = {
  name: string;
  province: string;
};

export async function fetchAvailableCities() {
  return apiRequest<City[]>("/products/available-cities");
}
