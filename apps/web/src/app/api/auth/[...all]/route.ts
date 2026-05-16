import {
  assertProductionAuthSecret,
  auth,
  toNextJsHandler,
} from "@teamsster/auth";

const authHandler = toNextJsHandler(auth);

export async function GET(request: Request) {
  assertProductionAuthSecret();
  return authHandler.GET(request);
}

export async function POST(request: Request) {
  assertProductionAuthSecret();
  return authHandler.POST(request);
}
