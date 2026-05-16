import { auth, toNextJsHandler } from "@teamsster/auth";

export const { GET, POST } = toNextJsHandler(auth);
