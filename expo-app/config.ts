// For local dev: use your Mac's IP (localhost doesn't work from simulator/device)
// For TestFlight: set EXPO_PUBLIC_API_URL in eas.json or use ngrok URL
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://35.178.139.5:8000';

// SMS 2FA is fully implemented but the AWS account is still in the End User
// Messaging SMS sandbox, which only delivers to pre-verified numbers -- a real
// user enrolling would just get "could not send verification code". Set
// EXPO_PUBLIC_TWO_FACTOR_ENABLED=true once production access is granted.
export const TWO_FACTOR_ENABLED = process.env.EXPO_PUBLIC_TWO_FACTOR_ENABLED === 'true';

// OAuth Client IDs (public, not secrets)
export const GOOGLE_CLIENT_ID = '336431541348-hbifi1ohb2hsomhqqe2i289nm6oehdpg.apps.googleusercontent.com';
// Reversed-client-ID URL scheme registered on the iOS OAuth client in Google Cloud Console.
// Google rejects the plain 'fincore' scheme for iOS clients. Must also be listed in app.json `scheme`.
export const GOOGLE_IOS_URL_SCHEME = `com.googleusercontent.apps.${GOOGLE_CLIENT_ID.replace('.apps.googleusercontent.com', '')}`;
export const GOOGLE_REDIRECT_URI = `${GOOGLE_IOS_URL_SCHEME}:/oauthredirect`;
export const MICROSOFT_CLIENT_ID = 'd371e6ba-5463-4b47-a5fe-c2c87506f610';
export const MICROSOFT_TENANT_ID = '08802439-90c8-400a-901b-79fabbd75eb7';
