import http from "k6/http";
import { check, sleep } from "k6";

// Configurable load profiles: normal, spike, sustained
const PROFILE = __ENV.PROFILE || "normal";
const BASE_URL = __ENV.TARGET_URL || "http://localhost:3000";

let stages = [
  { duration: "10s", target: 10 },
  { duration: "20s", target: 25 },
  { duration: "10s", target: 0 },
];

if (PROFILE === "spike") {
  stages = [
    { duration: "5s", target: 10 },
    { duration: "10s", target: 100 }, // Sudden spike to 100 VUs
    { duration: "10s", target: 100 },
    { duration: "5s", target: 0 },
  ];
} else if (PROFILE === "sustained") {
  stages = [
    { duration: "30s", target: 50 },
    { duration: "2m", target: 50 },  // Sustained load for 2 minutes
    { duration: "30s", target: 0 },
  ];
}

export const options = {
  stages: stages,
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests below 500ms
    http_req_failed: ["rate<0.01"],   // Error rate below 1%
  },
};

export default function () {
  // 1. Health check benchmark
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    "health status is 200": (r) => r.status === 200,
    "service is healthy": (r) => {
      try {
        return JSON.parse(r.body).status === "healthy";
      } catch (e) {
        return false;
      }
    },
  });

  sleep(0.5);

  // 2. Fetch public feed
  const feedRes = http.get(`${BASE_URL}/api/posts`);
  check(feedRes, {
    "posts feed is 200": (r) => r.status === 200,
  });

  sleep(0.5);
}
