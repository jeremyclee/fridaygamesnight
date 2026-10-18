/** Where Clover lives on the site. Pages under /clover, API under /api/clover. */
export const CLOVER_HOME = "/clover";
export const CREATE_PATH = "/clover/create";
export const CREATE_API = "/api/clover/puzzles";

export const puzzlePath = (id: string) => `/clover/${id}`;
export const solutionApi = (id: string) => `/api/clover/puzzles/${id}/solution`;
export const checkApi = (id: string) => `/api/clover/puzzles/${id}/check`;

/** Full share link. Browser only. */
export const puzzleUrl = (id: string) => `${window.location.origin}${puzzlePath(id)}`;
