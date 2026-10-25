import { SESSION_TOKEN_KEY, SESSION_USER_KEY } from "./config.js";

export function saveSession(token, user) {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function getToken() {
    return sessionStorage.getItem(SESSION_TOKEN_KEY);
}

export function getUser() {
    const raw = sessionStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function clearSession() {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
}

export function isLoggedIn() {
    return Boolean(getToken() && getUser());
}

export function isAdmin() {
    const user = getUser();
    return user?.role === "ADMIN";
}

export function isStudent() {
    const user = getUser();
    return user?.role === "STUDENT";
}

export function logout() {
    clearSession();
    window.location.hash = "#/login";
}