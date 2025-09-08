import * as Linking from 'expo-linking';

export const scheme = 'barbercuts';
export const redirectTo = Linking.createURL('/auth/callback'); // e.g., barbercuts://auth/callback
