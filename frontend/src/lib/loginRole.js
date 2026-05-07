const LOGIN_ROLE_KEY = "hiresphere_selected_login_role";

export function setSelectedLoginRole(role) {
  localStorage.setItem(LOGIN_ROLE_KEY, role);
}

export function getSelectedLoginRole() {
  return localStorage.getItem(LOGIN_ROLE_KEY) || "";
}

export function clearSelectedLoginRole() {
  localStorage.removeItem(LOGIN_ROLE_KEY);
}