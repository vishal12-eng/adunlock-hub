// Generate or retrieve a unique session ID for ad tracking
export function getSessionId(): string {
  let sessionId = localStorage.getItem('adnexus_session_id');
  
  if (!sessionId) {
    sessionId = 'sess_' + crypto.randomUUID();
    localStorage.setItem('adnexus_session_id', sessionId);
  }
  
  return sessionId;
}

export function clearSession(): void {
  localStorage.removeItem('adnexus_session_id');
}
