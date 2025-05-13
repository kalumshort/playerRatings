/* eslint-disable no-restricted-globals */

// src/service-worker.js
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

// This ensures Workbox will precache the app's assets.
precacheAndRoute(self.__WB_MANIFEST);

// Caching strategy for images (Stale-While-Revalidate)
registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate()
);

// Caching strategy for other resources (Network First)
registerRoute(
  ({ request }) => request.destination !== "image",
  new StaleWhileRevalidate()
);
